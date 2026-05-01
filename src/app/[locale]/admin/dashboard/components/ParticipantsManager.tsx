"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Trash2, Edit2, Save, X, User, Hash, School } from 'lucide-react';

interface Participant {
    id: string;
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

export default function ParticipantsManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        competition_id: 0,
        participant_name: '',
        unit_name: '',
        code_letter: '',
        category: ''
    });

    const schoolLevels = [
        "Lower Primary",
        "Upper Primary",
        "High School",
        "Higher Secondary",
        "Junior",
        "Senior",
        "General"
    ];

    useEffect(() => {
        fetchParticipants();
        fetchCompetitions();
    }, []);

    const fetchParticipants = async () => {
        try {
            const res = await fetch('/api/participants');
            const data = await res.json();
            setParticipants(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch participants error:', error);
        }
    };

    const fetchCompetitions = async () => {
        try {
            const res = await fetch('/api/competitions');
            const data = await res.json();
            setCompetitions(Array.isArray(data) ? data : []);
            if (data.length > 0 && !formData.competition_id) {
                setFormData(prev => ({ ...prev, competition_id: data[0].id, category: data[0].category }));
            }
        } catch (error) {
            console.error('Fetch competitions error:', error);
        }
    };

    const handleCompetitionChange = (id: number) => {
        const comp = competitions.find(c => c.id === id);
        setFormData({
            ...formData,
            competition_id: id,
            category: comp?.category || ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingId ? `/api/participants/${editingId}` : '/api/participants';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showToast(editingId ? 'Participant updated' : 'Participant added', 'success');
                resetForm();
                fetchParticipants();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to save', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (p: Participant) => {
        setEditingId(p.id);
        setFormData({
            competition_id: p.competition_id,
            participant_name: p.participant_name,
            unit_name: p.unit_name,
            code_letter: p.code_letter,
            category: p.category
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const res = await fetch(`/api/participants/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Deleted successfully', 'success');
                fetchParticipants();
            }
        } catch (error) {
            showToast('Delete failed', 'error');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            competition_id: competitions[0]?.id || 0,
            participant_name: '',
            unit_name: '',
            code_letter: '',
            category: competitions[0]?.category || ''
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-white">Participant Code Mapping</h2>
                    <p className="text-sm text-gray-400">Map real names to blind code letters for judges.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Competition</label>
                        <select 
                            value={formData.competition_id}
                            onChange={(e) => handleCompetitionChange(Number(e.target.value))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                        >
                            {competitions.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Participant Name</label>
                        <input 
                            required
                            type="text"
                            value={formData.participant_name}
                            onChange={(e) => setFormData({...formData, participant_name: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                            placeholder="Full Name"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Unit Name</label>
                        <input 
                            required
                            type="text"
                            value={formData.unit_name}
                            onChange={(e) => setFormData({...formData, unit_name: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                            placeholder="School/Unit"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Code Letter</label>
                        <input 
                            required
                            type="text"
                            maxLength={1}
                            value={formData.code_letter}
                            onChange={(e) => setFormData({...formData, code_letter: e.target.value.toUpperCase()})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50 font-bold text-center"
                            placeholder="A, B, C..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Category</label>
                        <select 
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                        >
                            {schoolLevels.map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-xl py-3 font-bold transition-all flex items-center justify-center gap-2"
                        >
                            {editingId ? <Save size={18} /> : <PlusCircle size={18} />}
                            {loading ? '...' : editingId ? 'Update' : 'Add Code'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 rounded-xl p-3"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </form>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Code</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Participant</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Unit</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Competition</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {participants.map((p) => {
                            const comp = competitions.find(c => c.id === p.competition_id);
                            return (
                                <tr key={p.id} className="group hover:bg-white/[0.02]">
                                    <td className="px-6 py-4">
                                        <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold font-bold">
                                            {p.code_letter}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{p.participant_name}</p>
                                                <p className="text-[10px] text-gray-500">{p.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">{p.unit_name}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-medium text-gray-400">{comp?.name || 'Unknown'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(p)} className="p-2 text-gray-500 hover:text-gold transition-colors"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            );
                        })}
                        {participants.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">No code mappings found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
