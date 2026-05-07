"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Trophy, ArrowRightLeft, Share2, X, Award, ChevronDown, Save, Edit3, Plus, ListPlus, Check, PlusCircle, Trash2, Upload } from 'lucide-react';
import { PRESET_PROGRAMS, CATEGORIES } from '@/lib/constants';
import * as XLSX from 'xlsx';

export default function ResultsManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [loading, setLoading] = useState(false);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [publishedResults, setPublishedResults] = useState<any[]>([]);
    const [bulkPreview, setBulkPreview] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [addingBulk, setAddingBulk] = useState(false);
    const [showCustomAdd, setShowCustomAdd] = useState(false);
    const [customProgramName, setCustomProgramName] = useState("");
    interface ResultItem {
        position: string;
        team_id: string;
        participant_names: string;
        points_awarded?: string;
    }
    
    const [existingFileUrls, setExistingFileUrls] = useState<string[]>([]);
    
    const [pageSettings, setPageSettings] = useState({
        results_title: "Live Results",
        results_subtitle: "Stay updated with real-time rankings and point tallies as they are declared."
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const [formData, setFormData] = useState<{
        competition_id: string;
        serial_number: string;
        results: ResultItem[];
    }>({
        competition_id: "",
        serial_number: "",
        results: [
            { position: "1", team_id: "", participant_names: "" },
            { position: "2", team_id: "", participant_names: "" },
            { position: "3", team_id: "", participant_names: "" },
            { position: "4", team_id: "", participant_names: "" },
            { position: "5", team_id: "", participant_names: "" }
        ]
    });

    const [selectedAdminCategory, setSelectedAdminCategory] = useState("All");

    const filteredCompetitions = useMemo(() => {
        if (!competitions) return [];
        return competitions
            .filter(c => {
                if (!selectedAdminCategory || selectedAdminCategory === "All") return true;
                return String(c.category || '').toLowerCase().trim() === String(selectedAdminCategory).toLowerCase().trim();
            })
            .sort((a, b) => {
                const numA = parseInt(a.serial_number) || 999;
                const numB = parseInt(b.serial_number) || 999;
                if (numA !== numB) return numA - numB;
                return (a.name || '').localeCompare(b.name || '');
            });
    }, [competitions, selectedAdminCategory]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [compRes, unitRes, resultsRes] = await Promise.all([
                fetch("/api/competitions"),
                fetch("/api/units"),
                fetch("/api/results")
            ]);

            const compData = await compRes.json();
            const unitData = await unitRes.json();
            const resultsData = await resultsRes.json();

            setCompetitions(Array.isArray(compData) ? compData : []);
            setUnits(Array.isArray(unitData) ? unitData : []);

            if (Array.isArray(resultsData)) {
                // Group by competition
                const grouped = resultsData.reduce((acc: any[], current: any) => {
                    let existing = acc.find((item: any) => String(item.competition_id) === String(current.competition_id));
                    if (!existing) {
                        existing = {
                            competition_id: current.competition_id,
                            competition_name: current.competitions?.name || "Unknown Competition",
                            category: current.competitions?.category || "Unknown Category",
                            serial_number: current.competitions?.serial_number || "",
                            result_images: (() => {
                                try {
                                    const parsed = JSON.parse(current.result_pdf_url || "[]");
                                    return Array.isArray(parsed) ? parsed : [current.result_pdf_url].filter(Boolean);
                                } catch (e) {
                                    return [current.result_pdf_url].filter(Boolean);
                                }
                            })(),
                            winners: []
                        };
                        acc.push(existing);
                    }
                    existing.winners.push(current);
                    return acc;
                }, []);
                setPublishedResults(grouped.sort((a: any, b: any) => {
                    const numA = parseInt(a.serial_number) || 999;
                    const numB = parseInt(b.serial_number) || 999;
                    if (numA !== numB) return numA - numB;
                    return (a.competition_name || '').localeCompare(b.competition_name || '');
                }));
            } else {
                setPublishedResults([]);
            }
        } catch (error) {
            console.error("Failed to fetch results data:", error);
            showToast("Failed to load data from server", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
        fetch("/api/settings").then(res => res.json()).then(data => {
            if (data.results_title || data.results_subtitle) {
                setPageSettings({
                    results_title: data.results_title || "Live Results",
                    results_subtitle: data.results_subtitle || "Stay updated with real-time rankings and point tallies as they are declared."
                });
            }
        });
    }, []);

    const handleSavePageSettings = async () => {
        setSavingSettings(true);
        try {
            await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pageSettings)
            });
            showToast("Results page header updated!", "success");
        } catch {
            showToast("Failed to update header", "error");
        } finally {
            setSavingSettings(false);
        }
    };

    const [resultFiles, setResultFiles] = useState<File[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let fileUrls = [...existingFileUrls];
            if (resultFiles.length > 0) {
                const uploadPromises = resultFiles.map(async (file) => {
                    const uploadData = new FormData();
                    uploadData.append("file", file);
                    const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
                    if (uploadRes.ok) {
                        const result = await uploadRes.json();
                        return result.fileUrl;
                    } else {
                        const errorData = await uploadRes.json();
                        showToast(errorData.error || `Failed to upload ${file.name}`, "error");
                        return null;
                    }
                });

                const uploadedUrls = await Promise.all(uploadPromises);
                fileUrls = [...fileUrls, ...uploadedUrls.filter(u => u !== null)];
            }
            const finalFileUrl = JSON.stringify(fileUrls);

            // CRITICAL: If publishing or editing, we MUST clear old results for this event first
            // to avoid "position already taken" errors from the backend.
            const deleteRes = await fetch(`/api/results?competition_id=${formData.competition_id}`, { method: "DELETE" });
            if (!deleteRes.ok && deleteRes.status !== 404) {
                 const errorData = await deleteRes.json();
                 showToast(errorData.error || "Failed to clear previous results", "error");
                 setLoading(false);
                 return;
            }

            // Publish all positions
            const promises = formData.results
                .filter(res => res.team_id && res.team_id.trim() !== "")
                .map(res => {
                    const selectedComp = competitions.find(c => c.id.toString() === formData.competition_id);
                    const isGroupEvent = selectedComp?.category?.toUpperCase() === 'GENERAL' || 
                                       selectedComp?.name?.toUpperCase().includes('GROUP');
                    
                    let points = res.points_awarded;
                    if (!points) {
                        if (isGroupEvent) {
                            points = res.position === '1' ? '15' : res.position === '2' ? '10' : res.position === '3' ? '5' : '0';
                        } else {
                            points = res.position === '1' ? '10' : res.position === '2' ? '5' : res.position === '3' ? '2' : '0';
                        }
                    }

                    return fetch("/api/results", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            competition_id: formData.competition_id,
                            team_id: res.team_id,
                            position: res.position,
                            points_awarded: points,
                            participant_names: res.participant_names,
                            result_pdf_url: finalFileUrl
                        }),
                    });
                });

            const responses = await Promise.all(promises);
            const allOk = responses.every(r => r.ok);

            if (allOk) {
                showToast(isEditing ? "Results updated successfully!" : "All results published successfully!", "success");
                setFormData({
                    competition_id: "",
                    serial_number: "",
                    results: [
                        { position: "1", team_id: "", participant_names: "" },
                        { position: "2", team_id: "", participant_names: "" },
                        { position: "3", team_id: "" , participant_names: ""},
                        { position: "4", team_id: "" , participant_names: ""},
                        { position: "5", team_id: "" , participant_names: ""}
                    ]
                });
                
                // Migrations for existing DBs
                const columns = ['serial_number', 'competition_type', 'template_image', 'description', 'results_only'];
                const selectedComp = competitions.find(c => c.id.toString() === formData.competition_id);
                if (selectedComp) {
                    const updatedCompData: any = { ...selectedComp };
                    let needsUpdate = false;
                    for (const col of columns) {
                        if (selectedComp[col] === undefined) {
                            updatedCompData[col] = null; // Or a suitable default value
                            needsUpdate = true;
                        }
                    }
                    if (formData.serial_number !== undefined) {
                        updatedCompData.serial_number = formData.serial_number;
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        await fetch(`/api/competitions/${formData.competition_id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(updatedCompData)
                        });
                    }
                }

                setResultFiles([]);
                setExistingFileUrls([]);
                setIsEditing(false);
                fetchInitialData();
            } else {
                showToast("Some results failed to publish.", "error");
            }
        } catch {
            showToast("A network error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdd = async (programName: string) => {
        if (!selectedAdminCategory || selectedAdminCategory === "All") {
            showToast("Please select a specific category first", "error");
            return;
        }

        setAddingBulk(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Check if already exists to avoid duplicates
            const exists = competitions.find(c => c.name === programName && c.category === selectedAdminCategory);
            if (exists) {
                showToast("This program already exists in this category", "error");
                setFormData({ ...formData, competition_id: exists.id.toString(), serial_number: exists.serial_number || "" });
                setAddingBulk(false);
                return;
            }

            const res = await fetch("/api/competitions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: programName,
                    date: today,
                    category: selectedAdminCategory,
                    competition_type: programName.includes("Group") ? "Group" : "Individual",
                    results_only: 1
                })
            });

            if (res.ok) {
                const newComp = await res.json();
                showToast(`${programName} added to ${selectedAdminCategory}`, "success");
                setShowCustomAdd(false);
                setCustomProgramName("");
                
                // Refresh list and select new one
                const freshRes = await fetch("/api/competitions");
                const freshData = await freshRes.json();
                setCompetitions(freshData);
                
                // Select the newly created event
                const added = freshData.find((c: any) => c.name === programName && c.category === selectedAdminCategory);
                if (added) {
                    setFormData({ ...formData, competition_id: added.id.toString(), serial_number: "" });
                }
            }
        } catch {
            showToast("Failed to add program", "error");
        } finally {
            setAddingBulk(false);
        }
    };

    const handleDeleteEvent = async () => {
        const compId = formData.competition_id;
        if (!compId) return;

        const comp = competitions.find(c => c.id.toString() === compId);
        if (!comp) return;

        if (!confirm(`Are you sure you want to delete "${comp.name}"? This will also delete any published results for THIS program.`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/competitions/${compId}`, { method: "DELETE" });
            if (res.ok) {
                showToast("Program deleted", "success");
                setFormData({ ...formData, competition_id: "", serial_number: "" });
                fetchInitialData();
            }
        } catch {
            showToast("Failed to delete program", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                
                // Read as 2D array for manual parsing
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];

                if (rows.length === 0) {
                    showToast("Excel file is empty", "error");
                    return;
                }

                setLoading(true);

                let headerRowIndex = -1;
                let detectedCompName = "";
                let detectedCategory = "";
                let detectedSerial = "";

                // 1. Find Header Row and Title metadata
                for (let i = 0; i < Math.min(rows.length, 30); i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue;
                    
                    const rowText = row.map(c => String(c || '').trim()).filter(Boolean);
                    const combined = rowText.join(" ");
                    const lowerCombined = combined.toLowerCase();

                    // Check for header keywords in this row
                    const isHeader = row.some(cell => {
                        const s = String(cell || '').toLowerCase().trim();
                        return s === "participant" || s === "team" || s === "prize" || s === "ch no";
                    });

                    if (isHeader && headerRowIndex === -1) {
                        headerRowIndex = i;
                        // Now we have the header, the competition name must be above this
                        continue;
                    }

                    if (headerRowIndex === -1) {
                        // Still looking for header, so these rows might be metadata
                        // Detect Category
                        for (const cat of CATEGORIES) {
                            if (lowerCombined.includes(cat.toLowerCase())) {
                                detectedCategory = cat;
                                break;
                            }
                        }

                        // Detect Competition Name
                        if (lowerCombined.includes("competition") || lowerCombined.includes("program") || lowerCombined.includes("item")) {
                             const parts = combined.split(/[:\-]/);
                             detectedCompName = parts[parts.length - 1].trim();
                        } else if (rowText.length === 1 && combined.length > 4 && !detectedCompName) {
                            // standalone row with one long string is likely the title
                            if (!combined.toLowerCase().includes("sahithyolsav") && !combined.toLowerCase().includes("result")) {
                                detectedCompName = combined;
                            }
                        }

                        // Detect Serial
                        if (lowerCombined.includes("result no") || lowerCombined.includes("sl no")) {
                            const match = combined.match(/\d+/);
                            if (match) detectedSerial = match[0];
                        }
                    }
                }

                if (headerRowIndex === -1) {
                    showToast("Could not detect table header (Participant/Team/Prize). Please ensure columns are named correctly.", "error");
                    setLoading(false);
                    return;
                }

                // Cleanup detected competition name (remove category if it was inside)
                if (detectedCompName && detectedCategory) {
                    detectedCompName = detectedCompName.replace(new RegExp(detectedCategory, 'gi'), "").replace(/[\(\)\-\:]/g, "").trim();
                }

                // 2. Map Column Indices
                const headerRow = rows[headerRowIndex];
                const colMap: any = {};
                headerRow.forEach((cell, idx) => {
                    const s = String(cell || '').toLowerCase().trim();
                    if (s.includes("participant")) colMap.participant = idx;
                    else if (s === "team" || s === "unit" || s === "branch") colMap.unit = idx;
                    else if (s === "prize" || s === "position" || s === "rank" || s === "place") colMap.prize = idx;
                    else if (s.includes("point")) colMap.points = idx;
                    else if (s === "ch no" || s === "sl no" || s === "serial") colMap.serial = idx;
                });

                // 3. Process Data Rows
                const resultsToProcess: any[] = [];
                for (let i = headerRowIndex + 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue;

                    const participantName = row[colMap.participant];
                    const unitName = row[colMap.unit];
                    const prizeValue = row[colMap.prize];
                    const pointsValue = row[colMap.points];
                    const serialValue = row[colMap.serial];

                    if (!unitName && !participantName) continue;

                    // Normalize Prize to Position
                    let position = "";
                    const prizeStr = String(prizeValue || '').toLowerCase().trim();
                    if (prizeStr.includes("1st") || prizeStr === "1") position = "1";
                    else if (prizeStr.includes("2nd") || prizeStr === "2") position = "2";
                    else if (prizeStr.includes("3rd") || prizeStr === "3") position = "3";
                    else if (prizeStr.includes("4th") || prizeStr === "4") position = "4";
                    else if (prizeStr.includes("5th") || prizeStr === "5") position = "5";

                    if (!position) {
                        const num = parseInt(prizeStr);
                        if (!isNaN(num) && num >= 1 && num <= 5) position = num.toString();
                        else continue; // skip non-winner rows
                    }

                    // Find Unit
                    const unit = units.find(u => 
                        String(u.unit_name).toLowerCase().trim() === String(unitName || '').toLowerCase().trim() ||
                        String(u.id).toLowerCase().trim() === String(unitName || '').toLowerCase().trim()
                    );

                    if (!unit) continue;

                    // Find existing competition
                    const comp = competitions.find(c => 
                        String(c.name).toLowerCase().trim() === String(detectedCompName).toLowerCase().trim() && 
                        String(c.category).toLowerCase().trim() === String(detectedCategory || 'General').toLowerCase().trim()
                    );

                    resultsToProcess.push({
                        competition_name: detectedCompName || "Unknown Competition",
                        category: detectedCategory || "General",
                        competition_id: comp?.id || null,
                        team_id: unit.id,
                        position: position,
                        participant_names: participantName || "",
                        points_awarded: pointsValue ? String(pointsValue) : null,
                        serial_number: detectedSerial || serialValue || (comp?.serial_number || "")
                    });
                }

                if (resultsToProcess.length === 0) {
                    showToast("No valid result rows found. Check column names (Participant, Team, Prize).", "error");
                    setLoading(false);
                    return;
                }

                // Group by competition
                const groupedByComp = resultsToProcess.reduce((acc, curr) => {
                    const key = `${curr.competition_name}-${curr.category}`;
                    if (!acc[key]) {
                        acc[key] = {
                            competition_id: curr.competition_id,
                            competition_name: curr.competition_name,
                            category: curr.category,
                            serial_number: curr.serial_number,
                            results: []
                        };
                    }
                    acc[key].results.push(curr);
                    return acc;
                }, {} as any);

                const previewArray = Object.values(groupedByComp).map((group: any) => {
                    const finalResults = [
                        { position: "1", team_id: "", participant_names: "", points_awarded: "" },
                        { position: "2", team_id: "", participant_names: "", points_awarded: "" },
                        { position: "3", team_id: "", participant_names: "", points_awarded: "" },
                        { position: "4", team_id: "", participant_names: "", points_awarded: "" },
                        { position: "5", team_id: "", participant_names: "", points_awarded: "" }
                    ];
                    
                    group.results.forEach((w: any) => {
                        const idx = parseInt(w.position) - 1;
                        if (idx >= 0 && idx < 5) {
                            finalResults[idx].team_id = w.team_id.toString();
                            finalResults[idx].participant_names = w.participant_names;
                            finalResults[idx].points_awarded = w.points_awarded || "";
                        }
                    });

                    return {
                        ...group,
                        results: finalResults
                    };
                });

                previewArray.sort((a: any, b: any) => (parseInt(a.serial_number) || 999) - (parseInt(b.serial_number) || 999));
                setBulkPreview(previewArray);
                showToast(`${previewArray.length} competitions parsed. Review and publish.`, "success");
            } catch (error) {
                console.error("Excel processing error:", error);
                showToast("Failed to process Excel file", "error");
            } finally {
                setLoading(false);
                if (e.target) e.target.value = "";
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkPublish = async () => {
        setLoading(true);
        console.log("Starting bulk publish for", bulkPreview.length, "competitions");
        let successCount = 0;
        let failCount = 0;

        try {
            for (const item of bulkPreview) {
                let compId = item.competition_id;
                console.log(`Processing competition: ${item.competition_name} (${item.category})`);
                
                // 1. Create competition if it doesn't exist
                if (!compId) {
                    console.log(`Competition not found. Creating new: ${item.competition_name}`);
                    const today = new Date().toISOString().split('T')[0];
                    const createRes = await fetch("/api/competitions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: item.competition_name,
                            date: today,
                            category: item.category,
                            competition_type: item.competition_name.toLowerCase().includes("group") ? "Group" : "Individual",
                            results_only: true,
                            serial_number: item.serial_number
                        })
                    });
                    
                    if (!createRes.ok) {
                        let errMsg = "Unknown error";
                        try {
                            const err = await createRes.json();
                            errMsg = err.error || err.message || errMsg;
                        } catch (e) {
                            errMsg = `Server error (${createRes.status})`;
                        }
                        console.error(`Failed to create competition: ${item.competition_name}`, errMsg);
                        failCount++;
                        continue;
                    }
                    
                    const newComp = await createRes.json();
                    compId = newComp.id;
                    console.log(`Created competition with ID: ${compId}`);
                } else {
                    // Update existing competition serial number
                    const comp = competitions.find(c => c.id.toString() === compId.toString());
                    if (comp && item.serial_number !== comp.serial_number) {
                        console.log(`Updating serial number for competition ID ${compId} to ${item.serial_number}`);
                         await fetch(`/api/competitions/${compId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...comp, serial_number: item.serial_number })
                        });
                    }
                }

                // 2. Delete existing results for this competition to prevent duplicates
                console.log(`Cleaning up old results for competition ID: ${compId}`);
                await fetch(`/api/results?competition_id=${compId}`, { method: "DELETE" });

                // 3. Post new results
                const validResults = item.results.filter((res: any) => res.team_id && res.team_id.trim() !== "");
                console.log(`Inserting ${validResults.length} result rows for competition ID: ${compId}`);
                
                const promises = validResults.map((res: any) => {
                    const isGroupEvent = item.category?.toUpperCase() === 'GENERAL' || 
                                       item.competition_name?.toUpperCase().includes('GROUP');
                    
                    let points = res.points_awarded;
                    if (!points) {
                        if (isGroupEvent) {
                            points = res.position === '1' ? '15' : res.position === '2' ? '10' : res.position === '3' ? '5' : '0';
                        } else {
                            points = res.position === '1' ? '10' : res.position === '2' ? '5' : res.position === '3' ? '2' : '0';
                        }
                    }

                    return fetch("/api/results", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            competition_id: compId,
                            team_id: res.team_id,
                            position: res.position,
                            points_awarded: points,
                            participant_names: res.participant_names,
                        }),
                    });
                });
                
                const resultResponses = await Promise.all(promises);
                const failedResult = resultResponses.find(r => !r.ok);
                if (failedResult) {
                    let errorMessage = "Unknown error";
                    try {
                        const err = await failedResult.json();
                        errorMessage = err.error || err.message || errorMessage;
                    } catch (e) {
                        errorMessage = `Server error (${failedResult.status})`;
                    }
                    throw new Error(`Failed to insert results for ${item.competition_name}: ${errorMessage}`);
                }
                
                successCount++;
                console.log(`Successfully published: ${item.competition_name}`);
            }

            if (failCount > 0 && successCount === 0) {
                showToast(`Failed to publish all ${failCount} competitions. Check console.`, "error");
            } else if (failCount > 0) {
                showToast(`Published ${successCount} competitions, but ${failCount} failed.`, "error");
                setBulkPreview([]);
                await fetchInitialData();
            } else {
                showToast(`Successfully published all ${successCount} competitions!`, "success");
                setBulkPreview([]);
                await fetchInitialData();
            }
        } catch (error: any) {
            console.error("Bulk publish error:", error);
            showToast(error.message || "Failed to publish results. Database error.", "error");
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const templateData = [
            {
                "Competition Name": "Elocution",
                "Category": "High School",
                "Position": "1",
                "Unit": "Unit Name",
                "Participant Name": "Participant Name",
                "Result Number": "1"
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Results");
        XLSX.writeFile(wb, "Results_Template.xlsx");
    };

    return (
        <div className="space-y-12">
            {/* Page Header Editor */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Edit3 size={18} className="text-gold" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Edit Results Page Header</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Page Title</label>
                        <input 
                            type="text"
                            value={pageSettings.results_title}
                            onChange={e => setPageSettings({...pageSettings, results_title: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                        />
                    </div>
                    <div className="space-y-1 flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Page Subtitle</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={pageSettings.results_subtitle}
                                onChange={e => setPageSettings({...pageSettings, results_subtitle: e.target.value})}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                            />
                            <button 
                                onClick={handleSavePageSettings}
                                disabled={savingSettings}
                                className="px-4 bg-gold/10 hover:bg-gold/20 text-gold rounded-xl border border-gold/30 transition-all disabled:opacity-50"
                            >
                                {savingSettings ? "..." : <Save size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-white mb-2">
                        {isEditing ? "Edit Published Results" : "Publish Results"}
                    </h2>
                    <p className="text-sm text-gray-400">
                        {isEditing 
                            ? `Modifying results for: ${competitions.find(c => c.id.toString() === formData.competition_id)?.name || "Selected Event"}` 
                            : "Award points to participants for specific events."}
                    </p>
                </div>

                {!isEditing && (
                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={downloadTemplate}
                            className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl border border-white/10 transition-all text-xs font-black uppercase tracking-widest"
                        >
                            <Download size={18} />
                            <span>Template</span>
                        </button>
                        <label className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-green-600/10 hover:bg-green-600/20 text-green-500 rounded-xl border border-green-600/30 transition-all text-xs font-black uppercase tracking-widest">
                            <Upload size={18} />
                            <span>Upload Excel</span>
                            <input 
                                type="file" 
                                accept=".xlsx, .xls" 
                                className="hidden" 
                                onChange={handleExcelUpload}
                                disabled={loading}
                            />
                        </label>
                    </div>
                )}
            </div>
            
            {bulkPreview.length > 0 ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-green-500">Bulk Upload Preview</h3>
                            <p className="text-sm text-green-500/70">Review and edit the results from your Excel file before publishing.</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setBulkPreview([])}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold border border-white/10"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleBulkPublish}
                                disabled={loading}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                            >
                                {loading ? "Publishing..." : "Publish All Results"}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {bulkPreview.map((item, pIdx) => (
                            <div key={pIdx} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                <div className="p-5 bg-white/5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gold/50 uppercase tracking-widest">Category</label>
                                            <select
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-gold transition-all"
                                                value={item.category}
                                                onChange={(e) => {
                                                    const next = [...bulkPreview];
                                                    next[pIdx].category = e.target.value;
                                                    setBulkPreview(next);
                                                }}
                                            >
                                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gold/50 uppercase tracking-widest">Competition Name</label>
                                            <div className="relative group/comp">
                                                <input 
                                                    type="text"
                                                    value={item.competition_name}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const next = [...bulkPreview];
                                                        next[pIdx].competition_name = val;
                                                        // Check for exact match to link existing ID
                                                        const match = competitions.find(c => 
                                                            c.name.toLowerCase().trim() === val.toLowerCase().trim() && 
                                                            c.category.toLowerCase().trim() === item.category.toLowerCase().trim()
                                                        );
                                                        next[pIdx].competition_id = match ? match.id : null;
                                                        setBulkPreview(next);
                                                    }}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-gold transition-all"
                                                    placeholder="Type competition name..."
                                                />
                                                <div className="absolute top-full left-0 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl mt-1 z-20 hidden group-focus-within/comp:block max-h-48 overflow-y-auto shadow-2xl p-1 backdrop-blur-xl">
                                                    <div className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 mb-1">Existing Programs</div>
                                                    {competitions
                                                        .filter(c => c.category === item.category)
                                                        .filter(c => c.name.toLowerCase().includes(item.competition_name.toLowerCase()) || item.competition_name === "")
                                                        .map(c => (
                                                            <div 
                                                                key={c.id} 
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    const next = [...bulkPreview];
                                                                    next[pIdx].competition_name = c.name;
                                                                    next[pIdx].competition_id = c.id;
                                                                    setBulkPreview(next);
                                                                }}
                                                                className="px-3 py-2 text-xs text-gray-300 hover:bg-gold/10 hover:text-gold rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                                                            >
                                                                <span>{c.name}</span>
                                                                {item.competition_id === c.id && <Check size={12} className="text-gold" />}
                                                            </div>
                                                        ))
                                                    }
                                                    {competitions.filter(c => c.category === item.category).length === 0 && (
                                                        <div className="px-3 py-4 text-center text-[10px] text-gray-500 italic">No existing programs in this category</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Serial</label>
                                            <input 
                                                type="text"
                                                value={item.serial_number}
                                                onChange={(e) => {
                                                    const next = [...bulkPreview];
                                                    next[pIdx].serial_number = e.target.value;
                                                    setBulkPreview(next);
                                                }}
                                                className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:border-gold outline-none text-center"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => setBulkPreview(prev => prev.filter((_, i) => i !== pIdx))}
                                            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {item.results.map((res: any, rIdx: number) => (
                                        <div key={rIdx} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${rIdx === 0 ? 'bg-gold text-black' : rIdx === 1 ? 'bg-gray-400 text-black' : rIdx === 2 ? 'bg-orange-400 text-black' : rIdx === 3 ? 'bg-blue-400 text-black' : 'bg-purple-400 text-black'}`}>
                                                    {rIdx + 1}
                                                </div>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                    {rIdx === 0 ? '1st' : rIdx === 1 ? '2nd' : rIdx === 2 ? '3rd' : rIdx === 3 ? '4th' : '5th'} Place
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <select
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-gold"
                                                    value={res.team_id}
                                                    onChange={(e) => {
                                                        const next = [...bulkPreview];
                                                        next[pIdx].results[rIdx].team_id = e.target.value;
                                                        setBulkPreview(next);
                                                    }}
                                                >
                                                    <option value="">-- Select Unit --</option>
                                                    {units.map(u => <option key={u.id} value={u.id.toString()}>{u.unit_name}</option>)}
                                                </select>
                                                <div className="flex-[1.5] flex gap-2">
                                                    <input 
                                                        type="text"
                                                        placeholder="Participant names"
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-gold"
                                                        value={res.participant_names}
                                                        onChange={(e) => {
                                                            const next = [...bulkPreview];
                                                            next[pIdx].results[rIdx].participant_names = e.target.value;
                                                            setBulkPreview(next);
                                                        }}
                                                    />
                                                    <input 
                                                        type="text"
                                                        placeholder="Pts"
                                                        title="Points"
                                                        className="w-12 bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-center text-gold outline-none focus:border-gold"
                                                        value={res.points_awarded || ""}
                                                        onChange={(e) => {
                                                            const next = [...bulkPreview];
                                                            next[pIdx].results[rIdx].points_awarded = e.target.value;
                                                            setBulkPreview(next);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400">Filter By Category</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer"
                            value={selectedAdminCategory}
                            onChange={(e) => {
                                setSelectedAdminCategory(e.target.value);
                                setFormData({ ...formData, competition_id: "" });
                            }}
                        >
                            <option value="All">All Categories</option>
                            <option value="Lower Primary">Lower Primary</option>
                            <option value="Upper Primary">Upper Primary</option>
                            <option value="High School">High School</option>
                            <option value="Higher Secondary">Higher Secondary</option>
                            <option value="Junior">Junior</option>
                            <option value="Senior">Senior</option>
                            <option value="General">General</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-semibold text-gray-400">Quick Add Program</label>
                            <button 
                                type="button"
                                onClick={() => setShowCustomAdd(!showCustomAdd)}
                                className="text-[10px] text-gold-light hover:underline font-bold"
                            >
                                {showCustomAdd ? "Use Presets" : "+ New Custom Program"}
                            </button>
                        </div>
                        <div className="relative">
                            {showCustomAdd ? (
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        placeholder="Enter program name"
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold"
                                        value={customProgramName}
                                        onChange={(e) => setCustomProgramName(e.target.value)}
                                    />
                                    <button 
                                        type="button"
                                        disabled={!customProgramName || addingBulk || selectedAdminCategory === "All"}
                                        onClick={() => handleQuickAdd(customProgramName)}
                                        className="px-4 bg-gold/10 hover:bg-gold/20 text-gold rounded-xl border border-gold/30 disabled:opacity-50"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <select
                                        disabled={addingBulk || selectedAdminCategory === "All"}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gold-light focus:outline-none focus:border-gold transition-colors appearance-none disabled:opacity-50"
                                        value=""
                                        onChange={(e) => handleQuickAdd(e.target.value)}
                                    >
                                        <option value="" disabled>-- Quick Add {selectedAdminCategory === "All" ? "" : `to ${selectedAdminCategory}`} --</option>
                                        {PRESET_PROGRAMS.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                    <PlusCircle size={16} className="absolute inset-y-0 right-4 top-1/2 -translate-y-1/2 text-gold-light pointer-events-none" />
                                </>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 italic">Added programs are internal to Results and won't show on the main schedule.</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-300">Select Event</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select
                                    required
                                    disabled={isEditing}
                                    className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors appearance-none ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    value={formData.competition_id}
                                    onChange={(e) => {
                                        const compId = e.target.value;
                                        setFormData({ ...formData, competition_id: compId });
                                    }}
                                >
                                    <option value="">{selectedAdminCategory === "All" ? "-- Select Category First --" : filteredCompetitions.length === 0 ? "-- No Competitions Found --" : "-- Choose Competition --"}</option>
                                    {filteredCompetitions.map(c => (
                                        <option key={c.id} value={c.id.toString()}>
                                            {c.name} [{c.category}]
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute inset-y-0 right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            {formData.competition_id && (
                                <button
                                    type="button"
                                    onClick={handleDeleteEvent}
                                    className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl transition-all"
                                    title="Remove this Program"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                        {selectedAdminCategory !== "All" && filteredCompetitions.length === 0 && (
                            <p className="text-[10px] text-red-400 mt-1 ml-1 font-bold">No competitions available in this category</p>
                        )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-300">Result Number (Serial)</label>
                        <input
                            type="text"
                            required
                            placeholder="Example: 1, 2, 3..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                            value={formData.serial_number}
                            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        />
                        <p className="text-[10px] text-gray-500 italic">This number will appear as "RESULT X" on the poster.</p>
                    </div>

                </div>

                <div className="space-y-8 bg-white/5 p-6 rounded-2xl border border-white/10">
                    {[0, 1, 2, 3, 4].map((idx) => (
                        <div key={idx} className="space-y-4 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${idx === 0 ? 'bg-gold text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-orange-400 text-black' : idx === 3 ? 'bg-blue-400 text-black' : 'bg-purple-400 text-black'}`}>
                                    {idx + 1}
                                </div>
                                <h4 className="text-white font-bold">
                                    {idx === 0 ? "1st" : idx === 1 ? "2nd" : idx === 2 ? "3rd" : idx === 3 ? "4th" : "5th"} Place
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400">Select Unit</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors appearance-none"
                                            value={formData.results[idx].team_id}
                                            onChange={(e) => {
                                                const newResults = [...formData.results];
                                                newResults[idx].team_id = e.target.value;
                                                setFormData({ ...formData, results: newResults });
                                            }}
                                        >
                                            <option value="">-- No Winner --</option>
                                            {units.map(u => <option key={u.id} value={u.id.toString()}>{u.unit_name}</option>)}
                                        </select>
                                        <ChevronDown size={16} className="absolute inset-y-0 right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400">Winner Names</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                                        placeholder="Participant name(s)"
                                        value={formData.results[idx].participant_names}
                                        onChange={(e) => {
                                            const newResults = [...formData.results];
                                            newResults[idx].participant_names = e.target.value;
                                            setFormData({ ...formData, results: newResults });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Upload Result Templates (Multiple Allowed)</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setResultFiles((prev) => [...prev, ...files]);
                                }}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all"
                            />
                        </div>
                    </div>
                    
                    {(existingFileUrls.length > 0 || resultFiles.length > 0) && (
                        <div className="grid grid-cols-2 gap-3 pb-4">
                            {existingFileUrls.map((url, idx) => (
                                <div key={`existing-${idx}`} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 h-32">
                                    <img src={url} alt="Existing" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            type="button"
                                            onClick={() => setExistingFileUrls(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-white bg-red-500 rounded-full p-2 hover:bg-red-600 shadow-xl"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-500/80 text-white text-[8px] rounded uppercase font-bold">Existing</span>
                                </div>
                            ))}
                            {resultFiles.map((file, idx) => (
                                <div key={`new-${idx}`} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 h-32">
                                    <img 
                                        src={URL.createObjectURL(file)} 
                                        alt="New" 
                                        className="w-full h-full object-cover"
                                        onLoad={(e) => URL.revokeObjectURL((e.currentTarget as any).src)}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            type="button"
                                            onClick={() => setResultFiles(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-white bg-red-500 rounded-full p-2 hover:bg-red-600 shadow-xl"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-green-500/80 text-white text-[8px] rounded uppercase font-bold">New</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !formData.competition_id || formData.results.every(r => r.team_id === "")}
                    className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        isEditing 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_30px_rgba(37,99,235,0.4)]' 
                        : 'bg-gradient-to-r from-gold-light to-gold text-black hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]'
                    }`}
                >
                    <Award size={18} />
                    {loading ? "Processing..." : isEditing ? "Update Results" : "Publish All Results"}
                </button>
                {isEditing && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false);
                            setExistingFileUrls([]);
                            setFormData({
                                competition_id: "",
                                serial_number: "",
                                results: [
                                    { position: "1", team_id: "", participant_names: "" },
                                    { position: "2", team_id: "", participant_names: "" },
                                    { position: "3", team_id: "", participant_names: "" },
                                    { position: "4", team_id: "", participant_names: "" },
                                    { position: "5", team_id: "", participant_names: "" }
                                ]
                            });
                        }}
                        className="w-full text-center text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        Cancel Editing
                    </button>
                )}
            </form>
            )}

            {/* List of Published Results */}
            <div className="mt-16 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-xl font-serif font-bold text-white">All Published Results</h3>
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total: {publishedResults.length}</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {publishedResults.length === 0 ? (
                        <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10 text-gray-500 italic">
                            No results published yet.
                        </div>
                    ) : (
                        publishedResults.map(res => (
                            <div key={res.competition_id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between group hover:border-gold/30 transition-all">
                                <div className="flex items-start gap-5">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 border-2 border-gold/40 text-gold font-black text-xl shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                                        {res.serial_number || "•"}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold text-lg uppercase tracking-tight">
                                            RESULT {res.serial_number} – {res.competition_name}
                                        </h4>
                                        <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-black mt-1">
                                            {res.category}
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                                            <p className="text-[10px] text-gray-400 italic font-medium">
                                                {res.winners.length} Winners added
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            const newResults = [
                                                { position: "1", team_id: "", participant_names: "" },
                                                { position: "2", team_id: "", participant_names: "" },
                                                { position: "3", team_id: "", participant_names: "" },
                                                { position: "4", team_id: "", participant_names: "" },
                                                { position: "5", team_id: "", participant_names: "" }
                                            ];
                                            res.winners.forEach((w: any) => {
                                                const idx = parseInt(w.position) - 1;
                                                if (idx >= 0 && idx < 5) {
                                                    newResults[idx].team_id = w.team_id?.toString() || "";
                                                    newResults[idx].participant_names = w.participant_names || "";
                                                }
                                            });
                                            setExistingFileUrls(res.result_images || []);
                                            const comp = competitions.find(c => c.id.toString() === res.competition_id.toString());
                                            setFormData({
                                                competition_id: res.competition_id.toString(),
                                                serial_number: comp?.serial_number || "",
                                                results: newResults
                                            });
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-bold hover:bg-white/20 transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to delete these results?")) {
                                                await fetch(`/api/results?competition_id=${res.competition_id}`, { method: "DELETE" });
                                                showToast("Results deleted", "success");
                                                fetchInitialData();
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/40 transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    </div>
    );
}
