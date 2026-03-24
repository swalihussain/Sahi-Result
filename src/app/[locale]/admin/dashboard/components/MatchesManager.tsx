"use client";

import { useState, useEffect } from "react";
import * as motion from "framer-motion/client";
import { List, Edit3, Save, Calendar, Search } from "lucide-react";

export default function MatchesManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [pageSettings, setPageSettings] = useState({
        matches_title: "Festival Schedule",
        matches_subtitle: "View the complete lineup of competitions and matches across all categories."
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/settings").then(res => res.json()).then(data => {
            if (data.matches_title || data.matches_subtitle) {
                setPageSettings({
                    matches_title: data.matches_title || "Festival Schedule",
                    matches_subtitle: data.matches_subtitle || "View the complete lineup of competitions and matches across all categories."
                });
            }
        });
        fetch("/api/competitions").then(res => res.json()).then(data => setCompetitions(data));
    }, []);

    const handleSavePageSettings = async () => {
        setSavingSettings(true);
        try {
            await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pageSettings)
            });
            showToast("Matches page header updated!", "success");
        } catch {
            showToast("Failed to update header", "error");
        } finally {
            setSavingSettings(false);
        }
    };

    const filtered = competitions.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            {/* Page Header Editor */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Edit3 size={18} className="text-gold" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Edit Schedule Page Header</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Page Title</label>
                        <input 
                            type="text"
                            value={pageSettings.matches_title}
                            onChange={e => setPageSettings({...pageSettings, matches_title: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                        />
                    </div>
                    <div className="space-y-1 flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Page Subtitle</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={pageSettings.matches_subtitle}
                                onChange={e => setPageSettings({...pageSettings, matches_subtitle: e.target.value})}
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

            {/* Schedule Preview */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-white">Current Program Schedule</h2>
                        <p className="text-xs text-gray-500">Live view of all matches according to your events data.</p>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input 
                            type="text"
                            placeholder="Search matches..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-gold/50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(c => (
                        <div key={c.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group hover:border-gold/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gold/10 rounded-lg text-gold group-hover:bg-gold group-hover:text-black transition-colors">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white">{c.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                        <span>{c.category}</span>
                                        {c.match_number && (
                                            <>
                                                <span className="text-gold">•</span>
                                                <span className="text-gold-light">Match {c.match_number}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-gray-500 block mb-1">Scheduled Time</span>
                                <span className="text-xs font-bold text-gray-300">{c.date}</span>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl text-gray-500 italic text-sm">
                            No matching programs found.
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
