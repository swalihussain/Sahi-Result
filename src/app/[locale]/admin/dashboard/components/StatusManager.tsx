"use client";

import { useState, useEffect } from "react";
import * as motion from "framer-motion/client";
import { Edit3, Trophy, Save, RotateCcw } from "lucide-react";

export default function StatusManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    
    const [heading, setHeading] = useState("🏆 Final Status");
    const [units, setUnits] = useState<{ institution: string, points: number }[]>([]);

    useEffect(() => {
        fetch("/api/status")
            .then(res => res.json())
            .then(data => {
                if (data.settings?.points_heading) {
                    setHeading(data.settings.points_heading);
                }
                setUnits(data.units || []);
                setFetching(false);
            })
            .catch(() => {
                showToast("Failed to load status details", "error");
                setFetching(false);
            });
    }, [showToast]);

    const handlePointChange = (index: number, val: string) => {
        const newUnits = [...units];
        newUnits[index].points = parseInt(val) || 0;
        setUnits(newUnits);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/status", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ heading, units })
            });

            if (res.ok) {
                showToast("Status and Points successfully updated!", "success");
            } else {
                showToast("Failed to update status", "error");
            }
        } catch {
            showToast("Network error occurred", "error");
        }
        setLoading(false);
    };

    if (fetching) return <div className="text-gray-400">Loading settings...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
            <div className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Manage Result Status</h2>
                <p className="text-sm text-gray-400">Update the live points leaderboard manually per unit.</p>
            </div>

            <div className="space-y-8">
                {/* Heading Setting */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Final Points Heading Text</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                            <Edit3 size={16} />
                        </div>
                        <input
                            required
                            type="text"
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                            placeholder="e.g. 🏆 Final Status"
                            value={heading}
                            onChange={(e) => setHeading(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-gray-500">This text appears at the top of the podium on the public Points page.</p>
                </div>

                {/* Units Setting */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Trophy size={16}/> Unit Manual Points Control</label>
                        <button onClick={() => window.location.reload()} className="text-xs text-gray-500 hover:text-white flex items-center gap-1"><RotateCcw size={12}/> Reset Changes</button>
                    </div>
                    
                    <div className="grid gap-3">
                        {units.length === 0 ? (
                            <div className="text-sm text-gray-500 p-4 bg-black/20 rounded-xl border border-white/5">No units registered yet. Make sure units have been initialized.</div>
                        ) : null}
                        {units.map((unit, index) => (
                            <div key={unit.institution} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="flex-1 font-bold text-gray-200 uppercase tracking-widest text-sm truncate">{unit.institution}</div>
                                <div className="w-32">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-gold font-bold text-right focus:outline-none focus:border-gold transition-colors"
                                            value={unit.points}
                                            onChange={(e) => handlePointChange(index, e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-gold/20 hover:bg-gold/30 text-gold-light border border-gold/50 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? "Saving..." : "Save Status & Leaderboard Settings"}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
