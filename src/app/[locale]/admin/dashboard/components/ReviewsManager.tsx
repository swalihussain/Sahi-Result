"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, User, Trophy, Calendar } from 'lucide-react';

interface Judgement {
    id: string;
    event_id: string;
    participant_name: string;
    unit_name: string;
    total_marks: number;
    feedback: string;
    judge_id: string;
    created_at: string;
    judges: { name: string };
    competitions: { name: string };
}

export default function ReviewsManager({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
    const [judgements, setJudgements] = useState<Judgement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchJudgements();
    }, []);

    const fetchJudgements = async () => {
        try {
            // We'll need a new API route for this
            const res = await fetch('/api/judgements?all=true');
            const data = await res.json();
            setJudgements(data);
        } catch (error) {
            showToast('Failed to load reviews', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                    <div className="col-span-full py-20 text-center text-gray-500">Loading judgements...</div>
                ) : judgements.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500">No judgements found yet.</div>
                ) : judgements.map((j) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={j.id}
                        className="glass p-6 rounded-2xl border border-white/10 hover:border-gold/30 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-white font-bold text-lg">{j.participant_name}</h4>
                                <p className="text-gold text-xs font-bold uppercase tracking-widest">{j.unit_name}</p>
                            </div>
                            <div className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm font-bold border border-gold/30">
                                {j.total_marks.toFixed(1)} / 100
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Calendar size={14} className="text-gold/50" />
                                <span className="text-xs truncate">{j.competitions?.name || 'Unknown Event'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <User size={14} className="text-gold/50" />
                                <span className="text-xs truncate">Judge: {j.judges?.name || 'Anonymous'}</span>
                            </div>
                        </div>

                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative overflow-hidden group-hover:border-gold/20 transition-colors">
                            <MessageSquare size={16} className="text-gold/30 absolute top-3 right-3" />
                            <p className="text-sm text-gray-300 italic leading-relaxed">
                                &ldquo;{j.feedback || 'No feedback provided.'}&rdquo;
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
