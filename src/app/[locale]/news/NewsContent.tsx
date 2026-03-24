"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Bell, MapPin, Radio, Loader2 } from 'lucide-react';

interface NewsContentProps {
    initialTitle: string;
    initialSubtitle: string;
}

function NewsContent({ initialTitle, initialSubtitle }: NewsContentProps) {
    const [newsItems, setNewsItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/announcements')
            .then(res => res.json())
            .then(data => {
                setNewsItems(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen pt-32 pb-24 px-5 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <span className="text-gold text-sm tracking-widest uppercase mb-2 block">Updates</span>
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{initialTitle}</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">{initialSubtitle}</p>
            </motion.div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 size={32} className="text-gold animate-spin" />
                </div>
            ) : newsItems.length === 0 ? (
                <div className="text-center py-20 glass rounded-xl">
                    <Radio size={48} className="mx-auto mb-4 text-gray-500 opacity-50" />
                    <h3 className="text-xl font-serif text-white mb-2">No active announcements</h3>
                    <p className="text-sm text-gray-400">Check back later for live broadcast updates.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {newsItems.map((news, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={news.id}
                            className={`group glass-card overflow-hidden !p-0 flex flex-col h-full border ${news.type === 'Ongoing Event' ? 'border-red-500/30' : 
                                news.type === 'Important Update' ? 'border-yellow-500/30' : 
                                'border-gold/30'}`}
                        >
                            <div className="p-6 flex flex-col flex-grow relative z-10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl group-hover:bg-gold/10 transition-colors pointer-events-none" />
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 ${news.type === 'Ongoing Event' ? 'bg-red-500/20 text-red-300' : 
                                        news.type === 'Important Update' ? 'bg-yellow-500/20 text-yellow-300' : 
                                        'bg-blue-500/20 text-blue-300'}`}
                                    >
                                        <Bell size={10} />
                                        {news.type}
                                    </div>
                                    
                                    {news.stage_number && (
                                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-gray-300 flex items-center gap-1">
                                            <MapPin size={12} className="text-gold" />
                                            {news.stage_number}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold mb-5 font-serif leading-snug text-white group-hover:text-gold transition-colors">
                                    {news.title}
                                </h3>
                                
                                <div className="mt-auto pt-5 border-t border-white/5 flex items-center gap-2 text-xs text-gray-400 font-medium">
                                    <Calendar size={14} className="text-gold" />
                                    <span>{news.date}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default NewsContent;
