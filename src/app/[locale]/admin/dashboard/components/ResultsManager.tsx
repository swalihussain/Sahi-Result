"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Trophy, ArrowRightLeft, Share2, X, Award, ChevronDown, Save, Edit3, Plus, ListPlus, Check, PlusCircle, Trash2 } from 'lucide-react';
import { PRESET_PROGRAMS, CATEGORIES } from '@/lib/constants';

export default function ResultsManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [loading, setLoading] = useState(false);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [publishedResults, setPublishedResults] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [addingBulk, setAddingBulk] = useState(false);
    const [showCustomAdd, setShowCustomAdd] = useState(false);
    const [customProgramName, setCustomProgramName] = useState("");
    interface ResultItem {
        position: string;
        team_id: string;
        participant_names: string;
    }
    
    const [existingFileUrls, setExistingFileUrls] = useState<string[]>([]);
    
    const [pageSettings, setPageSettings] = useState({
        results_title: "Live Results",
        results_subtitle: "Stay updated with real-time rankings and point tallies as they are declared."
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const [formData, setFormData] = useState({
        competition_id: "",
        results: [
            { position: "1", team_id: "", participant_names: "" },
            { position: "2", team_id: "", participant_names: "" },
            { position: "3", team_id: "", participant_names: "" },
            { position: "4", team_id: "", participant_names: "" }
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
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
                            competition_name: current.competition_name,
                            category: current.category,
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
                setPublishedResults(grouped);
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
                    
                    let points = "0";
                    if (isGroupEvent) {
                        points = res.position === '1' ? '15' : res.position === '2' ? '10' : res.position === '3' ? '5' : '0';
                    } else {
                        points = res.position === '1' ? '10' : res.position === '2' ? '5' : res.position === '3' ? '2' : '0';
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
                    match_number: "",
                    results: [
                        { position: "1", team_id: "", participant_names: "" },
                        { position: "2", team_id: "", participant_names: "" },
                        { position: "3", team_id: "" , participant_names: ""},
                        { position: "4", team_id: "" , participant_names: ""}
                    ]
                });
                
                // Migrations for existing DBs
                const columns = ['serial_number', 'match_number', 'competition_type', 'template_image', 'description', 'results_only'];
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
                    if (formData.match_number !== undefined) {
                        updatedCompData.match_number = formData.match_number;
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
                setFormData({ ...formData, competition_id: exists.id.toString(), serial_number: exists.serial_number || "", match_number: exists.match_number || "" });
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
                    setFormData({ ...formData, competition_id: added.id.toString(), serial_number: "", match_number: "" });
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
                setFormData({ ...formData, competition_id: "", serial_number: "", match_number: "" });
                fetchInitialData();
            }
        } catch {
            showToast("Failed to delete program", "error");
        } finally {
            setLoading(false);
        }
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
            </div>

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
                                            {c.name} {c.match_number ? `(Match ${c.match_number})` : ""} [{c.category}]
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

                </div>

                <div className="space-y-8 bg-white/5 p-6 rounded-2xl border border-white/10">
                    {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="space-y-4 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${idx === 0 ? 'bg-gold text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-orange-400 text-black' : 'bg-blue-400 text-black'}`}>
                                    {idx + 1}
                                </div>
                                <h4 className="text-white font-bold">
                                    {idx === 0 ? "1st" : idx === 1 ? "2nd" : idx === 2 ? "3rd" : "4th"} Place
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
                                match_number: "",
                                results: [
                                    { position: "1", team_id: "", participant_names: "" },
                                    { position: "2", team_id: "", participant_names: "" },
                                    { position: "3", team_id: "", participant_names: "" },
                                    { position: "4", team_id: "", participant_names: "" }
                                ]
                            });
                        }}
                        className="w-full text-center text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        Cancel Editing
                    </button>
                )}
            </form>

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
                                <div>
                                    <h4 className="text-white font-bold">{res.competition_name}</h4>
                                    <div className="flex gap-4 mt-1">
                                        <p className="text-xs text-gold uppercase tracking-widest font-black">{res.category}</p>
                                        <p className="text-xs text-gray-400">{res.winners.length} Winners added</p>
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
                                                { position: "4", team_id: "", participant_names: "" }
                                            ];
                                            res.winners.forEach((w: any) => {
                                                const idx = parseInt(w.position) - 1;
                                                if (idx >= 0 && idx < 4) {
                                                    newResults[idx].team_id = w.team_id?.toString() || "";
                                                    newResults[idx].participant_names = w.participant_names || "";
                                                }
                                            });
                                            setExistingFileUrls(res.result_images || []);
                                            const comp = competitions.find(c => c.id.toString() === res.competition_id.toString());
                                            setFormData({
                                                competition_id: res.competition_id.toString(),
                                                serial_number: comp?.serial_number || "",
                                                match_number: comp?.match_number || "",
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
