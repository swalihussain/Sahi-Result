"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Search, ChevronRight } from 'lucide-react';

interface Competition {
    id: number;
    name: string;
    category: string;
    date: string;
    template_image?: string;
    description?: string;
}

interface MatchesListProps {
    initialTitle: string;
    initialSubtitle: string;
    competitions: Competition[];
}

function MatchesList({ initialTitle, initialSubtitle, competitions }: MatchesListProps) {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const categories = ["All", ...Array.from(new Set(competitions.map(c => c.category)))];

    const filtered = competitions.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                              c.category.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen pt-32 pb-24 px-5 max-w-7xl mx-auto">
            {/* Header section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <span className="text-gold text-sm tracking-[0.3em] uppercase mb-3 block font-bold">The Lineup</span>
                <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 gold-gradient-text">{initialTitle}</h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">{initialSubtitle}</p>
            </motion.div>

            {/* Filters & Search */}
            <div className="flex flex-col gap-8 mb-16">
                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                selectedCategory === cat 
                                    ? 'bg-gold/10 border-2 border-gold text-white shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                                    : 'bg-transparent border border-white/10 text-gray-500 hover:text-white hover:border-white/30'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="relative w-full max-w-xl mx-auto group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" size={20} />
                    <input 
                        type="text"
                        placeholder="Search programs..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-white outline-none focus:border-gold/50 transition-all font-medium backdrop-blur-xl"
                    />
                </div>
            </div>

            {/* Program Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="group relative"
                    >
                        <div className="glass-card h-full !p-0 overflow-hidden border border-white/5 group-hover:border-gold/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,175,55,0.05)]">
                            <div className="h-2 w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-[10px] font-black text-gold uppercase tracking-widest">
                                        {item.category}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-serif font-bold text-white mb-6 group-hover:text-gold transition-colors leading-tight">
                                    {item.name}
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-gray-400">
                                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                            <Calendar size={14} className="text-gold" />
                                        </div>
                                        <span className="text-sm font-medium">{item.date}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-gray-400">
                                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                            <MapPin size={14} className="text-gold" />
                                        </div>
                                        <span className="text-sm font-medium">Main Stage</span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full border-2 border-bg-dark bg-gray-800" />
                                        <div className="w-8 h-8 rounded-full border-2 border-bg-dark bg-gray-700" />
                                        <div className="w-8 h-8 rounded-full border-2 border-bg-dark bg-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-400">+10</div>
                                    </div>
                                    <ChevronRight className="text-gray-600 group-hover:text-gold group-hover:translate-x-1 transition-all" size={20} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
                
                {filtered.length === 0 && (
                    <div className="col-span-full py-32 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-600 border border-white/5">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-white mb-2">No Programs Found</h3>
                        <p className="text-gray-500">We couldn't find any matches matching your search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MatchesList;
