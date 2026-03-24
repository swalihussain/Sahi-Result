"use client";

import { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as motion from 'framer-motion/client';
import { Trophy, Crown, Medal, Award, Download, Image as ImageIcon } from 'lucide-react';

interface Team {
    id: number | string;
    name: string;
    institution: string;
    total_points: number;
    wins: number;
}

export default function PointsTable() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [heading, setHeading] = useState("🏆 Final Status");
    const [loading, setLoading] = useState(true);
    const tableRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'Team' | 'Program'>('Team');

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            
            if (data.settings?.points_heading) {
                setHeading(data.settings.points_heading);
            }
            
            const mappedTeams = (data.units || []).map((u: any, i: number) => ({
                id: 'unit-' + i,
                name: u.institution,
                institution: u.institution,
                total_points: u.points,
                wins: 0
            }));
            
            setTeams(mappedTeams);
        } catch (error) {
            console.error("Error fetching teams status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadImage = async () => {
        if (tableRef.current) {
            const canvas = await html2canvas(tableRef.current, {
                backgroundColor: '#0d0e15',
                scale: 2
            });
            const link = document.createElement('a');
            link.download = `Sahityotsav_PointsTable.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    const handleDownloadPDF = async () => {
        if (tableRef.current) {
            const canvas = await html2canvas(tableRef.current, {
                backgroundColor: '#0d0e15',
                scale: 2
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Sahityotsav_PointsTable.pdf`);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-gold text-xl font-serif">
            Loading Live Standings...
        </div>
    );

    const topTeams = teams.slice(0, 3);
    const otherTeams = teams.slice(3);

    return (
        <div className="min-h-screen bg-bg-dark text-white py-20 px-4 md:px-8 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="max-w-6xl mx-auto relative z-10 p-5 mt-10">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="text-4xl md:text-5xl font-serif font-bold text-white mb-2"
                        >
                            Team Status 2026
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                            className="text-gray-400"
                        >
                            Live points status
                        </motion.p>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="flex bg-black/40 rounded-xl p-1 mt-6 border border-white/5 w-fit"
                        >
                            <button
                                onClick={() => setActiveTab('Program')}
                                className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'Program' ? 'bg-white/10 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Program
                            </button>
                            <button
                                onClick={() => setActiveTab('Team')}
                                className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'Team' ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Team
                            </button>
                        </motion.div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="flex gap-4"
                    >
                        <button onClick={handleDownloadImage} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition-all hover:border-gold/30">
                            <ImageIcon size={16} /> Image
                        </button>
                        <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition-all hover:border-gold/30">
                            <Download size={16} /> PDF
                        </button>
                    </motion.div>
                </div>

                {/* Capturable Area */}
                <div ref={tableRef} className="bg-bg-dark rounded-3xl md:p-12 relative overflow-hidden border border-transparent">
                    
                    <div className="text-center mb-16 mt-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                            className="inline-flex items-center justify-center gap-3 mb-2"
                        >
                            <h2 className="text-3xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-light to-gold drop-shadow-lg">{heading}</h2>
                        </motion.div>
                        <motion.p 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                            className="text-gray-400 text-sm tracking-widest uppercase mt-2"
                        >
                            Live Team Point Status
                        </motion.p>
                    </div>

                    {/* Top 3 Teams */}
                    <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-8 mb-20 max-w-5xl mx-auto">
                        
                        {/* 2nd Place */}
                        {topTeams[1] && (
                            <motion.div 
                                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                className="flex-[0.9] w-full bg-gradient-to-b from-gray-300/10 to-gray-500/5 border border-gray-400/30 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300"
                            >
                                <div className="absolute inset-0 bg-gray-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Medal className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 min-h-[56px] flex items-center justify-center">{topTeams[1].institution}</h3>
                                <div className="text-4xl md:text-5xl font-black text-red-500 mb-2">{topTeams[1].total_points}</div>
                                <div className="text-gray-400 text-sm mb-1">#2 Position</div>
                                <div className="text-gray-300 text-xs font-semibold uppercase tracking-wider">First Runners-up</div>
                            </motion.div>
                        )}

                        {/* 1st Place */}
                        {topTeams[0] && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.4 }}
                                className="flex-1 w-full bg-gradient-to-b from-gold/20 to-gold/5 border border-gold/40 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.15)] group hover:-translate-y-2 transition-transform duration-300 md:-translate-y-8"
                            >
                                <div className="absolute inset-0 bg-gold/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Crown className="w-14 h-14 text-gold mx-auto mb-4 drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                                <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2 min-h-[64px] flex items-center justify-center">{topTeams[0].institution}</h3>
                                <div className="text-5xl md:text-6xl font-black text-red-500 mb-2 drop-shadow-md">{topTeams[0].total_points}</div>
                                <div className="text-gold-light text-sm mb-1 font-medium">#1 Position</div>
                                <div className="text-gold text-xs font-bold uppercase tracking-widest">Champions</div>
                            </motion.div>
                        )}

                        {/* 3rd Place */}
                        {topTeams[2] && (
                            <motion.div 
                                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                                className="flex-[0.9] w-full bg-gradient-to-b from-[#cd7f32]/10 to-[#cd7f32]/5 border border-[#cd7f32]/30 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300"
                            >
                                <div className="absolute inset-0 bg-[#cd7f32]/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Award className="w-10 h-10 text-[#cd7f32] mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 min-h-[56px] flex items-center justify-center">{topTeams[2].institution}</h3>
                                <div className="text-4xl md:text-5xl font-black text-red-500 mb-2">{topTeams[2].total_points}</div>
                                <div className="text-gray-400 text-sm mb-1">#3 Position</div>
                                <div className="text-[#cd7f32] text-xs font-semibold uppercase tracking-wider">Second Runners-up</div>
                            </motion.div>
                        )}
                    </div>

                    {/* Other Teams Section */}
                    {otherTeams.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                        >
                            <div className="text-center mb-10 relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-bg-dark px-6 text-xl font-serif font-bold text-white tracking-wide">Other Teams</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {otherTeams.map((team, index) => (
                                    <motion.div 
                                        key={team.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 hover:border-white/20 transition-all group"
                                    >
                                        <h4 className="text-lg font-bold text-gray-200 mb-3 group-hover:text-white transition-colors line-clamp-1" title={team.institution}>{team.institution}</h4>
                                        <div className="text-3xl font-black text-red-500 mb-2">{team.total_points}</div>
                                        <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">#{index + 4} Position</div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
