"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Building2, ListFilter, ChevronDown } from "lucide-react";

export default function TeamsManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        category: "General",
        institution: "",
    });

    useEffect(() => {
        fetch("/api/units")
            .then(res => res.json())
            .then(data => setUnits(Array.isArray(data) ? data : []))
            .catch(err => console.error("Fetch units error:", err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                showToast("Participant registered successfully!", "success");
                setFormData({ name: "", category: "General", institution: "" });
            } else {
                const data = await res.json();
                showToast(data.message || "Failed to register participant", "error");
            }
        } catch {
            showToast("A network error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl">
            <div className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Register Participant</h2>
                <p className="text-sm text-gray-400">Add a new participant profile or team before assigning them results.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Participant / Team Name</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                            <Users size={16} />
                        </div>
                        <input
                            required
                            type="text"
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Category</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                            <ListFilter size={16} />
                        </div>
                        <select
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-gold transition-colors appearance-none"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Lower Primary">Lower Primary</option>
                            <option value="Upper Primary">Upper Primary</option>
                            <option value="High School">High School</option>
                            <option value="Higher Secondary">Higher Secondary</option>
                            <option value="Junior">Junior</option>
                            <option value="Senior">Senior</option>
                            <option value="General">General</option>
                        </select>
                        <ChevronDown size={16} className="absolute inset-y-0 right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Unit</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                            <Building2 size={16} />
                        </div>
                        <select
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-gold transition-colors appearance-none"
                            value={formData.institution}
                            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                        >
                            <option value="" disabled>-- Select Unit --</option>
                            {units.map(u => (
                                <option key={u.id} value={u.unit_name}>{u.unit_name}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute inset-y-0 right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 border border-blue-800/50 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                    <Users size={18} />
                    {loading ? "Registering..." : "Register Participant"}
                </button>
            </form>
        </motion.div>
    );
}
