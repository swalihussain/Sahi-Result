"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Printer, ChevronDown, ArrowLeft, Calendar, Search } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface Result {
    id: string;
    competition_id: number;
    code_letter: string;
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

export default function FinalResultsPage() {
    const [results, setResults] = useState<Result[]>([]);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [selectedCompId, setSelectedCompId] = useState<number | ''>('');
    const [loading, setLoading] = useState(true);

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

            const resultsData = await res1.json();
            const participantsData = await res2.json();
            const compsData = await res3.json();

            const merged = resultsData.map((r: any) => {
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
        } finally {
            setLoading(false);
        }
    };

    const sortedResults = useMemo(() => {
        if (!selectedCompId) return [];
        return results
            .filter(r => r.competition_id === selectedCompId)
            .sort((a, b) => (a.rank || 999) - (b.rank || 999));
    }, [results, selectedCompId]);

    const selectedComp = competitions.find(c => c.id === selectedCompId);

    const handlePrint = () => {
        if (!selectedCompId) return alert('Select a competition first');
        window.print();
    };

    return (
        <div className="min-h-screen bg-bg-dark text-gray-200 p-8">
            <header className="max-w-6xl mx-auto mb-12 no-print">
                <Link href="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest">
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-white mb-2">Final Blind Results</h1>
                        <p className="text-gray-400">Merged results showing real participant identities.</p>
                    </div>
                    <button 
                        onClick={handlePrint}
                        disabled={!selectedCompId}
                        className="flex items-center gap-3 px-8 py-4 bg-white/5 text-gold border border-white/10 rounded-2xl font-bold uppercase tracking-widest hover:bg-gold/10 hover:border-gold/30 transition-all disabled:opacity-30"
                    >
                        <Printer size={20} />
                        Print Result Sheet
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto space-y-8">
                {/* Competition Selector */}
                <section className="glass p-8 rounded-3xl border border-white/10 max-w-2xl no-print">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Select Competition to View Results</label>
                        <div className="relative">
                            <select 
                                value={selectedCompId}
                                onChange={(e) => setSelectedCompId(Number(e.target.value))}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">-- Choose Competition --</option>
                                {competitions.map(c => <option key={c.id} value={c.id}>{c.name} ({c.category})</option>)}
                            </select>
                            <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </section>

                {/* Results List */}
                {selectedCompId && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="overflow-x-auto no-print">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Rank</th>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Participant</th>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Unit</th>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Final Marks</th>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Feedback</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sortedResults.map((r) => (
                                        <tr key={r.id} className="group hover:bg-white/[0.02]">
                                            <td className="px-8 py-4 text-center">
                                                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-black text-xs ${
                                                    r.rank === 1 ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 
                                                    r.rank === 2 ? 'bg-gray-300 text-black' : 
                                                    r.rank === 3 ? 'bg-amber-600 text-white' : 
                                                    'bg-white/10 text-gray-400'
                                                }`}>
                                                    {r.rank}
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <p className="text-sm font-bold text-white">{r.participant_name}</p>
                                                <p className="text-[10px] text-gold/60 font-bold uppercase tracking-widest">Code: {r.code_letter}</p>
                                            </td>
                                            <td className="px-8 py-4 text-sm text-gray-400">{r.unit_name}</td>
                                            <td className="px-8 py-4 text-center font-serif font-black text-xl gold-gradient-text">
                                                {r.final_marks.toFixed(1)}
                                            </td>
                                            <td className="px-8 py-4">
                                                <p className="text-xs text-gray-500 italic leading-relaxed">&ldquo;{r.feedback || 'No feedback'}&rdquo;</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PRINT LAYOUT */}
                        <div className="hidden print:block bg-white text-black p-12 min-h-screen font-serif">
                            <div className="text-center mb-10 border-b-4 border-black pb-8">
                                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">Sahityotsav Official Result</h1>
                                <p className="text-2xl font-bold">{selectedComp?.name} — {selectedComp?.category}</p>
                                <div className="mt-4 inline-block px-4 py-1 border-2 border-black font-black uppercase text-sm tracking-widest">
                                    Final Verified Sheet
                                </div>
                            </div>

                            <table className="w-full border-collapse border-4 border-black">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border-2 border-black px-6 py-4 text-center font-black text-lg">RANK</th>
                                        <th className="border-2 border-black px-6 py-4 text-left font-black text-lg">PARTICIPANT NAME</th>
                                        <th className="border-2 border-black px-6 py-4 text-left font-black text-lg">UNIT / INSTITUTION</th>
                                        <th className="border-2 border-black px-6 py-4 text-center font-black text-lg">MARKS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedResults.map((r) => (
                                        <tr key={r.id}>
                                            <td className="border-2 border-black px-6 py-5 text-center font-black text-3xl">{r.rank}</td>
                                            <td className="border-2 border-black px-6 py-5 font-black text-xl uppercase">{r.participant_name}</td>
                                            <td className="border-2 border-black px-6 py-5 font-bold">{r.unit_name}</td>
                                            <td className="border-2 border-black px-6 py-5 text-center font-black text-2xl">{r.final_marks.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-24 flex justify-between items-end">
                                <div className="text-center">
                                    <div className="w-48 border-b-2 border-black mb-3"></div>
                                    <p className="text-xs font-black uppercase tracking-widest">Chief Judge Signature</p>
                                </div>
                                <div className="text-center pb-2">
                                     <p className="text-sm font-black uppercase tracking-[0.3em] opacity-30">Official Result Sheet</p>
                                     <p className="text-[10px] mt-1 font-mono italic">GEN_AUTH_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-48 border-b-2 border-black mb-3"></div>
                                    <p className="text-xs font-black uppercase tracking-widest">General Convener</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; color: black !important; }
                    .glass { border: none !important; background: none !important; padding: 0 !important; box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
}
