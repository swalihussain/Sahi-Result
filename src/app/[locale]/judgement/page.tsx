"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, LogOut, Filter, Save, Lock, Unlock, Trophy, Star, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

interface Competition {
    id: string;
    name: string;
    category: 'stage' | 'non-stage' | 'both';
}

interface Unit {
    id: string;
    name: string;
    institution: string;
}

interface Participant {
    name: string;
    unit: string;
    judge1?: number;
    judge2?: number;
    judge3?: number;
    marks?: number;
    feedback?: string;
}

export default function JudgementPanel() {
    const router = useRouter();
    const [judge, setJudge] = useState<any>(null);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<'stage' | 'non-stage'>('stage');
    const [selectedEventId, setSelectedEventId] = useState('');
    
    // Scoring state
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        checkAuth();
        fetchData();
    }, []);

    const checkAuth = async () => {
        const res = await fetch('/api/judge-auth');
        const data = await res.json();
        if (!data.authenticated) {
            router.push('/judge-login');
        } else {
            setJudge(data.judge);
        }
    };

    const fetchData = async () => {
        try {
            const [compRes, unitRes] = await Promise.all([
                fetch('/api/competitions'),
                fetch('/api/status')
            ]);
            
            const compData = await compRes.json();
            const unitData = await unitRes.json();
            
            setCompetitions(Array.isArray(compData) ? compData : []);
            setUnits(Array.isArray(unitData.units) ? unitData.units : []);
        } catch (error) {
            console.error('Fetch data error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/judge-auth', { method: 'DELETE' });
        router.push('/judge-login');
    };

    // Derived list of participants when event changes
    useEffect(() => {
        if (selectedEventId) {
            // Load existing judgements if any
            fetchJudgements();
        }
    }, [selectedEventId]);

    const fetchJudgements = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/judgements?eventId=${selectedEventId}&judgeId=${judge?.id}`);
            const data = await res.json();
            
            if (data.length > 0) {
                // Map existing judgements
                const mapped = data.map((j: any) => ({
                    name: j.participant_name,
                    unit: j.unit_name,
                    judge1: j.judge_1_marks,
                    judge2: j.judge_2_marks,
                    judge3: j.judge_3_marks,
                    marks: j.total_marks,
                    feedback: j.feedback
                }));
                setParticipants(mapped);
                setIsLocked(data[0].is_locked);
            } else {
                setParticipants([]);
                setIsLocked(false);
            }
        } catch (error) {
            console.error('Fetch judgements error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addParticipant = () => {
        setParticipants([...participants, { name: '', unit: units[0]?.name || '' }]);
    };

    const removeParticipant = (index: number) => {
        const updated = [...participants];
        updated.splice(index, 1);
        setParticipants(updated);
    };

    const updateParticipant = (index: number, field: keyof Participant, value: any) => {
        const updated = [...participants];
        updated[index] = { ...updated[index], [field]: value };
        
        // Auto-calculate final marks
        if (selectedCategory === 'stage') {
            const j1 = Number(updated[index].judge1 || 0);
            const j2 = Number(updated[index].judge2 || 0);
            const j3 = Number(updated[index].judge3 || 0);
            updated[index].marks = (j1 + j2 + j3) / 3;
        }
        
        setParticipants(updated);
    };

    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => (b.marks || 0) - (a.marks || 0));
    }, [participants]);

    const handleSave = async (lock = false) => {
        if (!selectedEventId) return alert('Select an event first');
        
        setIsSaving(true);
        try {
            const promises = participants.map(p => {
                const body = {
                    event_id: selectedEventId,
                    participant_name: p.name,
                    unit_name: p.unit,
                    judge_1_marks: p.judge1,
                    judge_2_marks: p.judge2,
                    judge_3_marks: p.judge3,
                    total_marks: p.marks || 0,
                    feedback: p.feedback,
                    category: selectedCategory,
                    judge_id: judge.id,
                    is_locked: lock,
                    rank: sortedParticipants.findIndex(sp => sp.name === p.name) + 1
                };
                
                return fetch('/api/judgements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            });

            await Promise.all(promises);

            if (lock) {
                setIsLocked(true);
                // Trigger leaderboard update logic here if needed
                await updateLeaderboard();
            }

            alert(lock ? 'Results Locked Successfully!' : 'Marks Saved Successfully!');
        } catch (error) {
            alert('Error saving results');
        } finally {
            setIsSaving(false);
        }
    };

    const updateLeaderboard = async () => {
        // Simple logic: 1st=5, 2nd=3, 3rd=1
        // This hits the /api/status endpoint to update points
        const pointsMapping = [5, 3, 1];
        
        try {
            const updates = sortedParticipants.slice(0, 3).map((p, idx) => {
                const unit = units.find(u => u.name === p.unit);
                if (!unit) return null;
                
                return fetch('/api/status', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'update_points',
                        unitName: p.unit,
                        addPoints: pointsMapping[idx]
                    })
                });
            }).filter(Boolean);

            await Promise.all(updates as any);
        } catch (error) {
            console.error('Leaderboard update error:', error);
        }
    };

    if (isLoading && !participants.length) {
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-dark text-gray-200 p-4 md:p-8 font-sans">
            <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gold/10 rounded-2xl text-gold border border-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-white tracking-tight">Judgement Panel</h1>
                        <p className="text-xs text-gold font-bold uppercase tracking-widest mt-0.5">
                            Signed in as: {judge?.name} ({judge?.category?.toUpperCase()})
                        </p>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-3 bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-900/50 hover:text-red-200 transition-all text-sm font-bold uppercase tracking-widest"
                >
                    <LogOut size={16} />
                    Exit Panel
                </button>
            </header>

            <main className="max-w-6xl mx-auto space-y-8">
                {/* Filters Section */}
                <section className="glass p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Filter size={120} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Judging Category</label>
                            <div className="relative">
                                <select 
                                    disabled={isLocked}
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer text-sm font-medium"
                                >
                                    <option value="stage">Stage Competitions</option>
                                    <option value="non-stage">Non-Stage Competitions</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Select Active Event</label>
                            <div className="relative">
                                <select 
                                    disabled={isLocked}
                                    value={selectedEventId}
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer text-sm font-medium"
                                >
                                    <option value="">-- Choose Competition --</option>
                                    {competitions
                                        .filter(c => judge?.category === 'both' || c.category === selectedCategory || c.category === 'both')
                                        .map(comp => (
                                            <option key={comp.id} value={comp.id}>{comp.name}</option>
                                        ))
                                    }
                                </select>
                                <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Participants List */}
                <section className="space-y-4">
                    <div className="flex justify-between items-end px-2">
                        <h2 className="text-xl font-serif font-bold text-white flex items-center gap-3">
                            <Star size={20} className="text-gold" />
                            Participants Evaluation
                        </h2>
                        {!isLocked && selectedEventId && (
                            <button 
                                onClick={addParticipant}
                                className="px-4 py-2 bg-gold/10 text-gold border border-gold/20 rounded-xl hover:bg-gold/20 transition-all text-xs font-bold uppercase tracking-widest"
                            >
                                + Add Row
                            </button>
                        )}
                    </div>

                    <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Participant Info</th>
                                        {selectedCategory === 'stage' ? (
                                            <>
                                                <th className="px-4 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-center">J1 Marks</th>
                                                <th className="px-4 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-center">J2 Marks</th>
                                                <th className="px-4 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-center">J3 Marks</th>
                                            </>
                                        ) : (
                                            <th className="px-4 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-center">Marks</th>
                                        )}
                                        <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-center">Final</th>
                                        <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Feedback</th>
                                        {!isLocked && <th className="px-4 py-5"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {participants.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center text-gray-500 font-medium italic">
                                                {selectedEventId ? 'Click "+ Add Row" to begin judging participants' : 'Please select an event to load participants'}
                                            </td>
                                        </tr>
                                    ) : participants.map((p, idx) => (
                                        <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 space-y-2 max-w-xs">
                                                <input 
                                                    disabled={isLocked}
                                                    type="text"
                                                    value={p.name}
                                                    onChange={(e) => updateParticipant(idx, 'name', e.target.value)}
                                                    placeholder="Name of Participant"
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-gold/30 outline-none transition-all font-semibold"
                                                />
                                                <select 
                                                    disabled={isLocked}
                                                    value={p.unit}
                                                    onChange={(e) => updateParticipant(idx, 'unit', e.target.value)}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-[11px] text-gold font-bold uppercase tracking-widest focus:border-gold/30 outline-none transition-all cursor-pointer"
                                                >
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.name}>{u.name}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            {selectedCategory === 'stage' ? (
                                                <>
                                                    <td className="px-2 py-4 text-center">
                                                        <input 
                                                            disabled={isLocked}
                                                            type="number"
                                                            min="0" max="100"
                                                            value={p.judge1 || ''}
                                                            onChange={(e) => updateParticipant(idx, 'judge1', e.target.value)}
                                                            className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-center text-white focus:border-gold/50 outline-none transition-all font-bold text-lg"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-4 text-center">
                                                        <input 
                                                            disabled={isLocked}
                                                            type="number"
                                                            min="0" max="100"
                                                            value={p.judge2 || ''}
                                                            onChange={(e) => updateParticipant(idx, 'judge2', e.target.value)}
                                                            className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-center text-white focus:border-gold/50 outline-none transition-all font-bold text-lg"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-4 text-center">
                                                        <input 
                                                            disabled={isLocked}
                                                            type="number"
                                                            min="0" max="100"
                                                            value={p.judge3 || ''}
                                                            onChange={(e) => updateParticipant(idx, 'judge3', e.target.value)}
                                                            className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-center text-white focus:border-gold/50 outline-none transition-all font-bold text-lg"
                                                        />
                                                    </td>
                                                </>
                                            ) : (
                                                <td className="px-2 py-4 text-center">
                                                    <input 
                                                        disabled={isLocked}
                                                        type="number"
                                                        min="0" max="100"
                                                        value={p.marks || ''}
                                                        onChange={(e) => updateParticipant(idx, 'marks', e.target.value)}
                                                        className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-center text-white focus:border-gold/50 outline-none transition-all font-bold text-lg"
                                                    />
                                                </td>
                                            )}

                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-2xl font-serif font-black gold-gradient-text">
                                                        {p.marks ? Number(p.marks).toFixed(1) : '0.0'}
                                                    </span>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Trophy size={10} className="text-gold" />
                                                        <span className="text-[10px] font-black text-white/40 uppercase">Rank {sortedParticipants.findIndex(sp => sp.name === p.name) + 1}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 min-w-[200px]">
                                                <textarea 
                                                    disabled={isLocked}
                                                    value={p.feedback || ''}
                                                    onChange={(e) => updateParticipant(idx, 'feedback', e.target.value)}
                                                    rows={2}
                                                    maxLength={500}
                                                    placeholder="Add judge feedback..."
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-300 focus:border-gold/30 outline-none transition-all resize-none italic"
                                                />
                                            </td>

                                            {!isLocked && (
                                                <td className="px-4 py-4">
                                                    <button 
                                                        onClick={() => removeParticipant(idx)}
                                                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                                    >
                                                        <LogOut size={16} className="rotate-180" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Footer Actions */}
                <section className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-white/5 pb-20">
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                        <div className={`w-3 h-3 rounded-full ${isLocked ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        Status: {isLocked ? 'LOCKED / READ-ONLY' : 'OPEN FOR EDITING'}
                    </div>

                    {!isLocked && participants.length > 0 && (
                        <div className="flex gap-4 w-full md:w-auto">
                            <button 
                                onClick={() => handleSave(false)}
                                disabled={isSaving}
                                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-xs"
                            >
                                <Save size={18} className="text-gold" />
                                {isSaving ? 'Saving...' : 'Save Draft'}
                            </button>
                            
                            <button 
                                onClick={() => {
                                    if (confirm('CAUTION: This will lock the results permanently. Only administrators can unlock them. Continue?')) {
                                        handleSave(true);
                                    }
                                }}
                                disabled={isSaving}
                                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-maroon text-white rounded-2xl hover:shadow-[0_0_20px_rgba(153,27,27,0.4)] transition-all font-bold uppercase tracking-widest text-xs border border-red-500/50"
                            >
                                <Lock size={18} />
                                {isSaving ? 'Locking...' : 'Lock Results'}
                            </button>
                        </div>
                    )}

                    {isLocked && (
                        <div className="bg-red-950/20 border border-red-900/30 px-6 py-4 rounded-2xl flex items-center gap-4">
                            <AlertCircle size={20} className="text-red-400" />
                            <p className="text-xs text-red-200 font-medium">
                                Results have been locked. Contact Admin to make changes.
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
