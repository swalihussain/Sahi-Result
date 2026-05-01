"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ChevronDown, User, Hash, ArrowLeft, Trash2, PlusCircle, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface Participant {
    id?: string;
    competition_id: number;
    participant_name: string;
    unit_name: string;
    code_letter: string;
    category: string;
}

interface Competition {
    id: number;
    name: string;
    category: string;
}

export default function AssignCodesPage() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedCompId, setSelectedCompId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const categories = ["Lower Primary", "Upper Primary", "High School", "Higher Secondary", "Junior", "Senior", "General"];

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        const res = await fetch('/api/competitions');
        const data = await res.json();
        setCompetitions(data);
    };

    useEffect(() => {
        if (selectedCompId) {
            fetchParticipants(selectedCompId as number);
        } else {
            setParticipants([]);
        }
    }, [selectedCompId]);

    const fetchParticipants = async (compId: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/participants?compId=${compId}`);
            const data = await res.json();
            setParticipants(data);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        if (!selectedCompId) return alert('Select competition first');
        setParticipants([...participants, { 
            competition_id: selectedCompId as number, 
            participant_name: '', 
            unit_name: '', 
            code_letter: '', 
            category: selectedCategory 
        }]);
    };

    const updateParticipant = (index: number, field: keyof Participant, value: string) => {
        const updated = [...participants];
        // @ts-ignore
        updated[index][field] = value;
        setParticipants(updated);
    };

    const handleSave = async () => {
        if (!selectedCompId) return;

        // Validation: Unique Codes
        const codes = participants.map(p => p.code_letter).filter(c => c.trim() !== '');
        const uniqueCodes = new Set(codes);
        if (uniqueCodes.size !== codes.length) {
            return alert('Duplicate code letter not allowed');
        }

        setSaving(true);
        try {
            // Save all rows
            const promises = participants.map(p => {
                if (p.id) {
                    return fetch(`/api/participants/${p.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(p)
                    });
                } else {
                    return fetch('/api/participants', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(p)
                    });
                }
            });

            await Promise.all(promises);
            alert('Codes saved successfully!');
            fetchParticipants(selectedCompId as number);
        } catch (error) {
            alert('Failed to save codes');
        } finally {
            setSaving(false);
        }
    };

    const filteredComps = competitions.filter(c => !selectedCategory || c.category === selectedCategory);

    return (
        <div className="min-h-screen bg-bg-dark text-gray-200 p-8">
            <header className="max-w-6xl mx-auto mb-12">
                <Link href="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest">
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-white mb-2">Assign Participant Codes</h1>
                        <p className="text-gray-400">Manual code letter assignment for blind judging security.</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={saving || !selectedCompId}
                        className="flex items-center gap-3 px-8 py-4 bg-gold/10 text-gold border border-gold/30 rounded-2xl font-bold uppercase tracking-widest hover:bg-gold/20 transition-all disabled:opacity-30 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                    >
                        <Save size={20} />
                        {saving ? 'Saving...' : 'Save Codes'}
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto space-y-8">
                {/* Filters */}
                <section className="glass p-8 rounded-3xl border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-2xl relative overflow-hidden">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">1. Choose Category</label>
                        <div className="relative">
                            <select 
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setSelectedCompId('');
                                }}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">-- Select Category --</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">2. Select Competition</label>
                        <div className="relative">
                            <select 
                                disabled={!selectedCategory}
                                value={selectedCompId}
                                onChange={(e) => setSelectedCompId(Number(e.target.value))}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer disabled:opacity-30"
                            >
                                <option value="">{selectedCategory ? "-- Choose Competition --" : "-- Select Category First --"}</option>
                                {filteredComps.map(comp => <option key={comp.id} value={comp.id}>{comp.name}</option>)}
                            </select>
                            <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </section>

                {/* Participants Table */}
                {selectedCompId && (
                    <section className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-3">
                                <Hash size={24} className="text-gold" />
                                Participant Mapping
                            </h2>
                            <button 
                                onClick={handleAddRow}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                <PlusCircle size={16} />
                                Add Participant
                            </button>
                        </div>

                        <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Participant Name</th>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Unit / School</th>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-center w-40">Code Letter</th>
                                        <th className="px-6 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {participants.map((p, idx) => (
                                        <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-4">
                                                <input 
                                                    type="text"
                                                    value={p.participant_name}
                                                    onChange={(e) => updateParticipant(idx, 'participant_name', e.target.value)}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-gold/30 outline-none transition-all"
                                                    placeholder="Enter name..."
                                                />
                                            </td>
                                            <td className="px-8 py-4">
                                                <input 
                                                    type="text"
                                                    value={p.unit_name}
                                                    onChange={(e) => updateParticipant(idx, 'unit_name', e.target.value)}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-gold/30 outline-none transition-all"
                                                    placeholder="Enter unit..."
                                                />
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <input 
                                                    type="text"
                                                    maxLength={1}
                                                    value={p.code_letter}
                                                    onChange={(e) => updateParticipant(idx, 'code_letter', e.target.value.toUpperCase())}
                                                    className="w-20 mx-auto bg-black/60 border border-gold/30 rounded-xl px-2 py-3 text-center text-xl font-black text-gold focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                                                    placeholder="?"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => {
                                                        const updated = [...participants];
                                                        updated.splice(idx, 1);
                                                        setParticipants(updated);
                                                    }}
                                                    className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {participants.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-gray-500 italic">
                                                {loading ? 'Loading participants...' : 'No participants found. Click "Add Participant" to begin mapping.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center gap-3 bg-gold/5 border border-gold/10 p-4 rounded-2xl mt-4">
                            <AlertCircle size={18} className="text-gold" />
                            <p className="text-xs text-gray-400">
                                <span className="font-bold text-gold">Note:</span> Codes must be unique within a competition. Judges will only see these code letters.
                            </p>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
