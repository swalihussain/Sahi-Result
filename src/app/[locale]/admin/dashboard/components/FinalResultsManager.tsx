"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Printer, Search, Calendar, ChevronDown } from 'lucide-react';

interface Result {
    id: string;
    competition_id: number;
    code_letter: string;
    judge1_marks: number;
    judge2_marks: number;
    judge3_marks: number;
    final_marks: number;
    rank: number;
    feedback: string;
    participant_name?: string;
    unit_name?: string;
}

interface Competition {
    id: number;
    name: string;
    category: string;
}

export default function FinalResultsManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [results, setResults] = useState<Result[]>([]);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompId, setSelectedCompId] = useState<number | 'all'>('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [res1, res2, res3] = await Promise.all([
                fetch('/api/results'),
                fetch('/api/participants'),
                fetch('/api/competitions')
            ]);

            const rRaw = await res1.json();
            const pRaw = await res2.json();
            const cRaw = await res3.json();

            const resultsData = Array.isArray(rRaw) ? rRaw : [];
            const participantsData = Array.isArray(pRaw) ? pRaw : [];
            const compsData = Array.isArray(cRaw) ? cRaw : [];

            // Merge results with participants
            const merged = resultsData.map((r: Result) => {
                const p = participantsData.find((p: any) => 
                    p.competition_id === r.competition_id && p.code_letter === r.code_letter
                );
                return {
                    ...r,
                    participant_name: p?.participant_name || 'Unknown',
                    unit_name: p?.unit_name || 'Unknown'
                };
            });

            setResults(merged);
            setCompetitions(compsData);
        } catch (error) {
            console.error('Fetch error:', error);
            showToast('Failed to load results', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = useMemo(() => {
        if (selectedCompId === 'all') return results;
        return results.filter(r => r.competition_id === selectedCompId);
    }, [results, selectedCompId]);

    const sortedResults = useMemo(() => {
        return [...filteredResults].sort((a, b) => (a.rank || 999) - (b.rank || 999));
    }, [filteredResults]);

    const handlePrint = () => {
        if (selectedCompId === 'all') {
            alert('Please select a specific competition to print results.');
            return;
        }
        window.print();
    };

    const selectedComp = competitions.find(c => c.id === selectedCompId);

    if (loading) {
        return <div className="py-20 text-center text-gray-500">Loading final results...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-white">Final Blind Results</h2>
                    <p className="text-sm text-gray-400">Merged results showing real names and verified rankings.</p>
                </div>

                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <select 
                            value={selectedCompId}
                            onChange={(e) => setSelectedCompId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="w-full md:w-64 bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-sm text-white outline-none appearance-none cursor-pointer focus:border-gold/50 transition-all"
                        >
                            <option value="all">All Competitions</option>
                            {competitions.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    </div>

                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10 transition-all"
                    >
                        <Printer size={16} />
                        Print Result Sheet
                    </button>
                </div>
            </div>

            {/* Result Table for Screen */}
            <div className="overflow-x-auto no-print">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Rank</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Participant</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Unit</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Final Marks</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Judge Feedback</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedResults.map((r) => (
                            <tr key={r.id} className="group hover:bg-white/[0.02]">
                                <td className="px-6 py-4 text-center">
                                    <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-sm ${
                                        r.rank === 1 ? 'bg-gold text-black' : 
                                        r.rank === 2 ? 'bg-gray-300 text-black' : 
                                        r.rank === 3 ? 'bg-amber-600 text-white' : 
                                        'bg-white/10 text-gray-400'
                                    }`}>
                                        {r.rank}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-white">{r.participant_name}</p>
                                    <p className="text-[10px] text-gold/60 font-bold uppercase tracking-widest">Code: {r.code_letter}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-300">{r.unit_name}</td>
                                <td className="px-6 py-4 text-center font-serif font-black text-lg gold-gradient-text">
                                    {r.final_marks.toFixed(1)}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-xs text-gray-500 italic max-w-xs">&ldquo;{r.feedback || '...'}&rdquo;</p>
                                </td>
                            </tr>
                        ))}
                        {sortedResults.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-gray-500 italic">No results found for selection.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PRINT LAYOUT (Hidden on screen) */}
            <div className="hidden print:block bg-white text-black p-12 min-h-screen font-serif">
                <div className="text-center mb-10 border-b-2 border-black pb-8">
                    <h1 className="text-4xl font-bold uppercase tracking-widest mb-2">Sahityotsav Official Result</h1>
                    <p className="text-lg font-bold">{selectedComp?.name} — {selectedComp?.category}</p>
                    <p className="text-sm mt-2 opacity-70 italic text-gray-600 uppercase">Verification Level: Final Verified</p>
                </div>

                <table className="w-full border-collapse border-2 border-black">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border-2 border-black px-4 py-3 text-center font-bold">Rank</th>
                            <th className="border-2 border-black px-4 py-3 text-left font-bold">Participant Name</th>
                            <th className="border-2 border-black px-4 py-3 text-left font-bold">Unit / Institution</th>
                            <th className="border-2 border-black px-4 py-3 text-center font-bold">Marks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedResults.map((r) => (
                            <tr key={r.id}>
                                <td className="border-2 border-black px-4 py-4 text-center font-bold text-xl">{r.rank}</td>
                                <td className="border-2 border-black px-4 py-4 font-bold">{r.participant_name}</td>
                                <td className="border-2 border-black px-4 py-4">{r.unit_name}</td>
                                <td className="border-2 border-black px-4 py-4 text-center font-bold">{r.final_marks.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-16 flex justify-between items-end border-t border-gray-200 pt-8">
                    <div className="text-center">
                        <div className="w-40 border-b border-black mb-2"></div>
                        <p className="text-xs font-bold">Chief Judge</p>
                    </div>
                    <div className="text-center">
                         <p className="text-lg font-bold uppercase tracking-widest text-gray-300">Official Result Sheet</p>
                         <p className="text-[10px] mt-2 italic">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-center">
                        <div className="w-40 border-b border-black mb-2"></div>
                        <p className="text-xs font-bold">Convener</p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; color: black !important; }
                    .glass-card, .glass { border: none !important; background: none !important; padding: 0 !important; box-shadow: none !important; }
                    header, aside, .tabs-nav { display: none !important; }
                }
            `}</style>
        </div>
    );
}
