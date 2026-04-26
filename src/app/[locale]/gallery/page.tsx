"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { X, Play } from 'lucide-react';

export default function GalleryPage() {
    const t = useTranslations('Gallery');
    const [filter, setFilter] = useState('All');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadedImages, setUploadedImages] = useState<any[]>([]);
    const [pageSettings, setPageSettings] = useState({
        title: "Memories",
        subtitle: "Relive the incredible performances and memorable moments from the festival highlights."
    });

    // Fetch dynamically uploaded images
    useEffect(() => {
        fetch('/api/gallery')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const dynamicItems = data.map((url: string, i: number) => {
                        const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                        return {
                            id: `upload-${i}`,
                            type: isVideo ? 'video' : 'image',
                            category: 'Highlights',
                            url: url,
                            // Create a masonry look pattern only for desktop
                            span: i % 4 === 0 ? 'col-span-1 row-span-1 md:col-span-2 md:row-span-2' : 'col-span-1 row-span-1'
                        };
                    });
                    setUploadedImages(dynamicItems);
                } else {
                    setUploadedImages([]);
                }
            })
            .catch(err => console.error("Failed fetching gallery", err));

        // Fetch header settings
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data && typeof data === 'object') {
                    setPageSettings({
                        title: data.gallery_title || t('title'),
                        subtitle: data.gallery_subtitle || t('subtitle')
                    });
                }
            });
    }, []);

    // Removed dummy gallery data based on user request
    const allItems = [...uploadedImages];
    const filteredItems = filter === 'All' ? allItems : allItems.filter(i => i.type === filter);

    const filters = [
        { label: "All Media", value: 'All' },
        { label: "Videos", value: 'video' },
        { label: "Photos", value: 'image' }
    ];

    return (
        <div className="min-h-screen pt-32 pb-24 px-5 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <span className="text-gold text-sm tracking-widest uppercase mb-2 block">Moments</span>
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{pageSettings.title}</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">{pageSettings.subtitle}</p>
            </motion.div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
                {filters.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-8 py-3 rounded-full border transition-all whitespace-nowrap text-[10px] md:text-xs font-black uppercase tracking-[0.2em] ${filter === f.value
                            ? 'bg-gold/10 border-2 border-gold text-white shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                            : 'glass text-gray-400 border-white/10 hover:border-gold/50'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-4 auto-rows-[160px] md:auto-rows-[250px] gap-2 md:gap-4 grid-flow-dense"
            >
                {filteredItems.map((item) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        key={item.id}
                        className={`group relative overflow-hidden rounded-2xl cursor-pointer bg-white/5 border border-white/10 hover:border-gold/50 transition-colors ${item.span}`}
                        onClick={() => setSelectedImage(item.url)}
                    >
                        {item.type === 'video' ? (
                            <video
                                src={item.url}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                muted
                                loop
                                playsInline
                                onMouseOver={e => (e.target as HTMLVideoElement).play().catch(() => {})}
                                onMouseOut={e => {
                                    const v = e.target as HTMLVideoElement;
                                    v.pause();
                                    v.currentTime = 0;
                                }}
                            />
                        ) : (
                            <img
                                src={item.url}
                                alt="Gallery Item"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                            />
                        )}
                        {item.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white">
                                    <Play fill="currentColor" className="ml-0.5 md:ml-1 w-4 h-4 md:w-6 md:h-6" />
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                            <span className="text-gold font-medium tracking-wider uppercase text-sm">{item.type}</span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-5 backdrop-blur-sm">
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={32} />
                    </button>
                    {selectedImage.match(/\.(mp4|webm|ogg)$/i) ? (
                        <motion.video
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={selectedImage}
                            controls
                            autoPlay
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(212,175,55,0.15)]"
                        />
                    ) : (
                        <motion.img
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={selectedImage}
                            alt="Expanded view"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(212,175,55,0.15)]"
                        />
                    )}
                </div>
            )}
        </div>
    );
}
