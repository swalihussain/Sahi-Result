"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, Edit2, Shield, ShieldOff, Save, X } from 'lucide-react';

interface Judge {
    id: string;
    name: string;
    email: string;
    password?: string;
    category: 'stage' | 'non-stage' | 'both';
    status: 'active' | 'inactive';
}

export default function JudgesManager({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
    const [judges, setJudges] = useState<Judge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Judge>>({
        name: '',
        email: '',
        password: '',
        category: 'stage',
        status: 'active'
    });

    useEffect(() => {
        fetchJudges();
    }, []);

    const fetchJudges = async () => {
        try {
            const res = await fetch('/api/judges');
            const data = await res.json();
            setJudges(data);
        } catch (error) {
            showToast('Failed to load judges', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...formData, id: editingId } : formData;
            
            const res = await fetch('/api/judges', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error();

            showToast(editingId ? 'Judge updated' : 'Judge added');
            setEditingId(null);
            setFormData({ name: '', email: '', password: '', category: 'stage', status: 'active' });
            fetchJudges();
        } catch (error) {
            showToast('Action failed', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const res = await fetch(`/api/judges?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            showToast('Judge deleted');
            fetchJudges();
        } catch (error) {
            showToast('Delete failed', 'error');
        }
    };

    const toggleStatus = async (judge: Judge) => {
        try {
            const newStatus = judge.status === 'active' ? 'inactive' : 'active';
            const res = await fetch('/api/judges', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: judge.id, status: newStatus })
            });
            if (!res.ok) throw new Error();
            showToast(`Judge is now ${newStatus}`);
            fetchJudges();
        } catch (error) {
            showToast('Status update failed', 'error');
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl border border-white/10 space-y-4">
                        <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2 mb-4">
                            {editingId ? <Edit2 size={18} className="text-gold" /> : <Plus size={18} className="text-gold" />}
                            {editingId ? 'Edit Judge' : 'Add New Judge'}
                        </h3>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Judge Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                placeholder="Enter full name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Email Address</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                placeholder="judge@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Password</label>
                            <input
                                type="password"
                                required={!editingId}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                placeholder={editingId ? "Leave blank to keep current" : "Set password"}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Assigned Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            >
                                <option value="stage">Stage Competitions</option>
                                <option value="non-stage">Non-Stage Competitions</option>
                                <option value="both">Both</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 bg-gradient-to-r from-gold to-gold/70 text-black font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : editingId ? 'Update Judge' : 'Add Judge'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({ name: '', email: '', password: '', category: 'stage', status: 'active' });
                                    }}
                                    className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="lg:col-span-2">
                    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-gray-400 font-semibold uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Judge</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading judges...</td>
                                    </tr>
                                ) : judges.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No judges found</td>
                                    </tr>
                                ) : judges.map(judge => (
                                    <tr key={judge.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white">{judge.name}</div>
                                            <div className="text-xs text-gray-500">{judge.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] uppercase font-bold text-gray-400">
                                                {judge.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => toggleStatus(judge)}
                                                className={`flex items-center gap-2 font-medium ${judge.status === 'active' ? 'text-green-400' : 'text-red-400'}`}
                                            >
                                                {judge.status === 'active' ? <Shield size={14} /> : <ShieldOff size={14} />}
                                                {judge.status.toUpperCase()}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setEditingId(judge.id);
                                                        setFormData({ ...judge, password: '' });
                                                    }}
                                                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(judge.id)}
                                                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
