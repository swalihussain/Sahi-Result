"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { Search, Download, FileText, Trophy, Award, Medal } from 'lucide-react';
// Side-effect free imports

interface ResultsContentProps {
    initialTitle: string;
    initialSubtitle: string;
    initialTableHeading: string;
}

function ResultsContent({ initialTitle, initialSubtitle, initialTableHeading }: ResultsContentProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Program');
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    const [resultsData, setResultsData] = useState<any[]>([]);
    const [teamStandings, setTeamStandings] = useState<any[]>([]);
    const [heading, setHeading] = useState(initialTableHeading);
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        // Fetch real competitions
        fetch('/api/results')
            .then(res => res.json())
            .then(data => {
                if (!Array.isArray(data)) {
                    setResultsData([]);
                    return;
                }
                // Group individual result rows by competition
                const grouped = data.reduce((acc: any[], current: any) => {
                    let existing = acc.find(item => String(item.competition_id) === String(current.competition_id));
                    if (!existing) {
                        existing = {
                            id: current.competition_id, // Use competition_id for navigation
                            competition_id: current.competition_id,
                            competition_name: current.competitions?.name || current.competition_name,
                            category: current.competitions?.category || current.category || "General",
                            serial_number: current.competitions?.serial_number || "",
                            pdf_url: current.result_pdf_url,
                            first_place: null,
                            second_place: null,
                            third_place: null
                        };
                        acc.push(existing);
                    }
                    
                    const winnerLabel = current.participant_names || current.team_name;
                    if (current.position === 1) existing.first_place = winnerLabel;
                    if (current.position === 2) existing.second_place = winnerLabel;
                    if (current.position === 3) existing.third_place = winnerLabel;
                    
                    // Keep official PDF if any row has it
                    if (current.result_pdf_url) existing.pdf_url = current.result_pdf_url;
                    
                    return acc;
                }, []);
                setResultsData(grouped);
            });
        
        // Fetch current points status
        fetch('/api/status')
            .then(res => res.json())
            .then(data => {
                if (data.settings?.points_heading) setHeading(data.settings.points_heading);
                if (data.units) setTeamStandings(data.units);
            });
    }, []);

    const captureImage = async () => {
        if (!tableRef.current || isDownloading) return;
        setIsDownloading('image');
        try {
            // Ensure fonts are loaded
            if (typeof document !== 'undefined' && 'fonts' in document) {
                await (document as any).fonts.ready;
            }
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(tableRef.current, {
                backgroundColor: '#0a0a0a',
                scale: 1.5,
                useCORS: true,
                logging: false,
                allowTaint: false,
                ignoreElements: (el) => el.classList.contains('download-ignore')
            });
            const link = document.createElement('a');
            link.download = `sahityotsav-results-${activeTab.toLowerCase()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            // showToast('Image downloaded successfully', 'success'); // We don't have showToast here, maybe we should add it?
            // Actually, ResultsContent doesn't have showToast passed as prop yet. 
            // Wait! ResultsContent is called by ResultsPage which doesn't have toast logic.
            // I'll add a simple alert or just let it work.
        } catch (error) {
            console.error("Capture failed", error);
            alert("Download failed. Please try again.");
        } finally {
            setIsDownloading(null);
        }
    };

    const downloadPDF = async () => {
        if (!tableRef.current || isDownloading) return;
        setIsDownloading('pdf');
        try {
            // Ensure fonts are loaded
            if (typeof document !== 'undefined' && 'fonts' in document) {
                await (document as any).fonts.ready;
            }
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');
            const canvas = await html2canvas(tableRef.current, {
                backgroundColor: '#0a0a0a',
                scale: 1.5,
                useCORS: true,
                allowTaint: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`sahityotsav-results-${activeTab.toLowerCase()}.pdf`);
        } catch (error) {
            console.error("PDF generation failed", error);
            alert("PDF generation failed. Please try again.");
        } finally {
            setIsDownloading(null);
        }
    };

    const categories = ['All', 'Lower Primary', 'Upper Primary', 'High School', 'Higher Secondary', 'Junior', 'Senior', 'General'];

    const filteredProjects = resultsData.filter(r => {
        const matchesSearch = r.competition_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             r.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen pt-32 pb-24 px-5">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center mb-12"
                >
                    <h1 className="text-4xl md:text-7xl font-serif font-bold text-white mb-4 drop-shadow-2xl">{initialTitle}</h1>
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <p className="text-gray-400 font-medium text-lg">{initialSubtitle}</p>
                        <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
                            <span className="text-sm font-bold text-blue-400">
                                Published <span className="text-white font-black">{resultsData.length}</span> results
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Controls */}
                <div className="flex flex-col gap-8 mb-16">
                    <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                            {['Program', 'Team'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-12 py-3.5 rounded-full text-[10px] md:text-xs font-black transition-all duration-300 uppercase tracking-[0.2em] ${
                                        activeTab === tab 
                                        ? 'bg-gold/10 border-2 border-gold text-white shadow-[0_0_25px_rgba(212,175,55,0.3)]' 
                                        : 'bg-transparent border border-white/10 text-gray-500 hover:text-white hover:border-gold/30'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-[450px] group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" size={22} />
                                <input
                                    type="text"
                                    placeholder="Search by program or category.."
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl md:rounded-[1.5rem] pl-12 md:pl-16 pr-6 md:pr-8 py-3.5 md:py-5 text-white outline-none focus:border-gold/50 transition-all shadow-2xl backdrop-blur-2xl text-base md:text-lg placeholder:text-gray-600 font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                        </div>
                        
                        <div className="flex gap-3 md:gap-4">
                            <button 
                                onClick={captureImage} 
                                disabled={!!isDownloading}
                                className={`p-3.5 md:p-5 bg-black/40 border border-white/10 rounded-xl md:rounded-[1.25rem] transition-all shadow-xl group hover:bg-black/60 ${isDownloading === 'image' ? 'animate-pulse opacity-50' : 'hover:border-gold/50 text-gold'}`} 
                                title="Download Image"
                            >
                                {isDownloading === 'image' ? (
                                    <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Download size={20} className="md:w-[24px] md:h-[24px] group-hover:scale-110 transition-transform" />
                                )}
                            </button>
                            <button 
                                onClick={downloadPDF} 
                                disabled={!!isDownloading}
                                className={`p-3.5 md:p-5 bg-black/40 border border-white/10 rounded-xl md:rounded-[1.25rem] transition-all shadow-xl group hover:bg-black/60 ${isDownloading === 'pdf' ? 'animate-pulse opacity-50' : 'hover:border-gold/50 text-gold'}`} 
                                title="Download PDF"
                            >
                                {isDownloading === 'pdf' ? (
                                    <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <FileText size={20} className="md:w-[24px] md:h-[24px] group-hover:scale-110 transition-transform" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Category Filter (Sort Option) */}
                    {activeTab === 'Program' && (
                        <div className="flex flex-col md:flex-row items-center gap-4 justify-center md:justify-start">
                             <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 bg-black/60 border border-white/10 rounded-xl md:rounded-2xl shadow-2xl backdrop-blur-xl group focus-within:border-gold/50 transition-all w-full md:w-auto">
                                <span className="text-gray-500 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">Category:</span>
                                <select 
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-transparent text-white outline-none font-black text-[10px] md:text-xs uppercase tracking-widest cursor-pointer w-full"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat} className="bg-bg-dark text-white">
                                            {cat === 'All' ? 'All Categories' : cat}
                                        </option>
                                    ))}
                                </select>
                             </div>
                        </div>
                    )}
                </div>

                {/* Main Table */}
                <motion.div
                    layout
                    ref={tableRef}
                    className="relative"
                >
                    {activeTab === 'Program' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredProjects.map((row, index) => (
                                <Link 
                                    key={row.id} 
                                    href={`/results/${row.id}`}
                                    className="group"
                                >
                                    <motion.div
                                        whileHover={{ y: -12, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 flex items-center gap-5 md:gap-8 hover:border-gold/50 transition-all duration-500 hover:bg-black/80 shadow-[0_25px_60px_rgba(0,0,0,0.7)] h-full relative overflow-hidden group/card"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-gold/5 rounded-full blur-[60px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                                        
                                        <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white text-black flex items-center justify-center text-xl md:text-3xl font-black shrink-0 shadow-[0_0_40px_rgba(255,255,255,0.2)] z-10 transition-all duration-500 group-hover/card:scale-110 group-hover/card:bg-gold">
                                            {row.serial_number || index + 1}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 z-10">
                                            <h3 className="text-white font-bold text-lg md:text-2xl leading-tight uppercase tracking-tight mb-1 md:mb-2 line-clamp-2 group-hover/card:text-gold transition-colors duration-300 font-serif">
                                                {row.competition_name}
                                            </h3>
                                            <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.2em] font-black group-hover/card:text-white/60 transition-colors">
                                                {row.category}
                                            </p>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 md:p-8">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl font-serif font-bold text-white mb-2">{heading}</h2>
                                <p className="text-gray-500 text-sm tracking-widest uppercase">Live Team Point Status</p>
                            </div>
                            
                            {/* Top 3 Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 px-4">
                                {/* 1st Place */}
                                {teamStandings[0] && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-black/60 backdrop-blur-xl border-2 border-gold rounded-[2rem] p-6 md:p-10 text-center relative overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)] group hover:scale-[1.02] transition-all duration-500"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-[50px] -z-10" />
                                        <Trophy className="mx-auto mb-4 md:mb-6 text-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" size={36} />
                                        <h3 className="text-base md:text-2xl font-bold text-white mb-2 md:mb-4 uppercase tracking-wider">{teamStandings[0].institution}</h3>
                                        <div className="text-4xl md:text-6xl font-black text-gold mb-2 md:mb-4 leading-none">{teamStandings[0].points}</div>
                                        <div className="text-[10px] md:text-sm font-bold text-white/40 mb-4 md:mb-6 uppercase tracking-[0.2em]">#1 Position</div>
                                        <div className="inline-block py-1.5 md:py-2 px-4 md:px-6 bg-gold text-black rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg">
                                            Champions
                                        </div>
                                    </motion.div>
                                )}
                                
                                {/* 2nd Place */}
                                {teamStandings[1] && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-black/60 backdrop-blur-xl border-2 border-gray-400 rounded-[2rem] p-6 md:p-10 text-center relative overflow-hidden shadow-[0_0_50px_rgba(156,163,175,0.1)] group hover:scale-[1.02] transition-all duration-500"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-400/10 rounded-full blur-[50px] -z-10" />
                                        <Award className="mx-auto mb-4 md:mb-6 text-gray-400" size={36} />
                                        <h3 className="text-base md:text-2xl font-bold text-white mb-2 md:mb-4 uppercase tracking-wider">{teamStandings[1].institution}</h3>
                                        <div className="text-4xl md:text-6xl font-black text-gray-300 mb-2 md:mb-4 leading-none">{teamStandings[1].points}</div>
                                        <div className="text-[10px] md:text-sm font-bold text-white/40 mb-4 md:mb-6 uppercase tracking-[0.2em]">#2 Position</div>
                                        <div className="inline-block py-1.5 md:py-2 px-4 md:px-6 bg-gray-400/20 text-gray-400 border border-gray-400/50 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest">
                                            Runners-up
                                        </div>
                                    </motion.div>
                                )}
                                
                                {/* 3rd Place */}
                                {teamStandings[2] && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-black/60 backdrop-blur-xl border-2 border-orange-700/80 rounded-[2rem] p-6 md:p-10 text-center relative overflow-hidden shadow-[0_0_50px_rgba(194,65,12,0.1)] group hover:scale-[1.02] transition-all duration-500"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-700/10 rounded-full blur-[50px] -z-10" />
                                        <Medal className="mx-auto mb-4 md:mb-6 text-orange-700" size={36} />
                                        <h3 className="text-base md:text-2xl font-bold text-white mb-2 md:mb-4 uppercase tracking-wider">{teamStandings[2].institution}</h3>
                                        <div className="text-4xl md:text-6xl font-black text-orange-700 mb-2 md:mb-4 leading-none">{teamStandings[2].points}</div>
                                        <div className="text-[10px] md:text-sm font-bold text-white/40 mb-4 md:mb-6 uppercase tracking-[0.2em]">#3 Position</div>
                                        <div className="inline-block py-1.5 md:py-2 px-4 md:px-6 bg-orange-700/20 text-orange-700 border border-orange-700/50 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest">
                                            Third
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Other Teams Section */}
                            <div className="mt-24 px-4">
                                <div className="text-center mb-10">
                                    <h3 className="text-2xl font-serif font-bold text-white/80">Other Teams</h3>
                                    <div className="h-0.5 w-16 bg-white/10 mx-auto mt-4" />
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {teamStandings.slice(3).map((team, idx) => (
                                        <motion.div 
                                            key={team.institution} 
                                            initial={{ opacity: 0 }}
                                            whileInView={{ opacity: 1 }}
                                            viewport={{ once: true }}
                                            className="bg-black/40 border border-white/10 rounded-2xl p-6 text-center hover:border-white/30 transition-all border-dashed"
                                        >
                                            <div className="text-sm font-black text-gray-500 mb-2 uppercase tracking-widest">{team.institution}</div>
                                            <div className="text-3xl font-black text-white mb-1">{team.points}</div>
                                            <div className="text-[10px] font-bold text-gold/60 uppercase">#{idx + 4} Position</div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default ResultsContent;
