"use client";

import { useTranslations } from 'next-intl';
import * as motion from 'framer-motion/client';
import { useState, useEffect } from 'react';

export default function AboutPage() {
    const t = useTranslations('AboutPage');
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data));
    }, []);

    // Fallback content while loading or if settings missing
    const content = {
        title: settings?.about_page_title || t('title'),
        since: settings?.about_page_since || "Since 1993",
        p1: settings?.about_page_p1 || t('p1'),
        p2: settings?.about_page_p2 || t('p2'),
        p3: settings?.about_page_p3 || t('p3'),
        stat1_num: settings?.about_page_stat1_num || "32+",
        stat1_lab: settings?.about_page_stat1_lab || "Years of Excellence",
        stat2_num: settings?.about_page_stat2_num || "26",
        stat2_lab: settings?.about_page_stat2_lab || "States Covered",
        stat3_num: settings?.about_page_stat3_num || "5K+",
        stat3_lab: settings?.about_page_stat3_lab || "Vibrant Students",
        cta_title: settings?.about_page_cta_title || "Witness the Talent Unfold",
        cta_desc: settings?.about_page_cta_desc || "Join us in experiencing the towering figures of the realm of cultural festivals.",
        img1: settings?.about_page_img1 || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop",
        img2: settings?.about_page_img2 || "https://images.unsplash.com/photo-1543854589-9b9eb2dd45d1?q=80&w=1974&auto=format&fit=crop",
        img3: settings?.about_page_img3 || "https://images.unsplash.com/photo-1523580494112-071dcb85170d?q=80&w=1974&auto=format&fit=crop",
        img4: settings?.about_page_img4 || "/poster.jpg"
    };

    const hasImages = content.img1 || content.img2 || content.img3 || content.img4;

    return (
        <div className="min-h-screen bg-bg-dark text-white relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-gold/10 via-maroon/5 to-transparent pointer-events-none -z-10" />
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-maroon/10 blur-[150px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gold/5 blur-[150px] rounded-full pointer-events-none -z-10" />

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-5 max-w-7xl mx-auto text-center">
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="text-3xl md:text-7xl font-serif font-bold mb-6 gold-gradient-text drop-shadow-lg"
                >
                    {content.title}
                </motion.h1>
                <motion.div 
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                    className="w-24 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto"
                />
            </section>

            <section className="pb-24 px-5 max-w-7xl mx-auto">
                <div className={`grid grid-cols-1 ${hasImages ? 'lg:grid-cols-2' : 'max-w-4xl mx-auto'} gap-16 items-center`}>
                    {/* Left: Images */}
                    {hasImages && (
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
                            className="relative lg:order-1"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4 pt-12">
                                    {content.img1 && (
                                        <div className="aspect-[4/5] rounded-2xl overflow-hidden glass p-1 transform hover:-translate-y-2 transition-transform duration-500 shadow-2xl">
                                            <img src={content.img1} alt="Legacy 1" className="w-full h-full object-cover rounded-xl" />
                                        </div>
                                    )}
                                    {content.img2 && (
                                        <div className="aspect-square rounded-2xl overflow-hidden glass p-1 transform hover:-translate-y-2 transition-transform duration-500 shadow-2xl">
                                            <img src={content.img2} alt="Legacy 2" className="w-full h-full object-cover rounded-xl" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {content.img3 && (
                                        <div className="aspect-square rounded-2xl overflow-hidden glass p-1 transform hover:-translate-y-2 transition-transform duration-500 shadow-2xl">
                                            <img src={content.img3} alt="Legacy 3" className="w-full h-full object-cover rounded-xl" />
                                        </div>
                                    )}
                                    {content.img4 && (
                                        <div className="aspect-[4/5] rounded-2xl overflow-hidden glass p-1 transform hover:-translate-y-2 transition-transform duration-500 shadow-2xl">
                                            <img src={content.img4} alt="Legacy 4" className="w-full h-full object-cover rounded-xl opacity-90 grayscale-[20%]" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Right: Text & Stats */}
                    <motion.div 
                        initial={{ opacity: 0, x: hasImages ? 50 : 0, y: hasImages ? 0 : 20 }} 
                        animate={{ opacity: 1, x: 0, y: 0 }} 
                        transition={{ duration: 0.8 }}
                        className={`space-y-8 ${!hasImages ? 'text-center' : ''}`}
                    >
                        <div className="glass-card shadow-2xl border border-white/5 relative overflow-hidden backdrop-blur-xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-[50px] -z-10" />
                            
                            <h3 className={`text-2xl font-serif font-bold text-white mb-6 flex items-center gap-3 ${!hasImages ? 'justify-center' : ''}`}>
                                <span className="w-8 h-[2px] bg-gold" />
                                {content.since}
                            </h3>
                            
                            <div className="space-y-4 text-gray-300 leading-relaxed font-light text-sm md:text-base">
                                <p>{content.p1}</p>
                                <p>{content.p2}</p>
                                <p>{content.p3}</p>
                            </div>
                        </div>

                        {/* Interactive Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { number: content.stat1_num, label: content.stat1_lab },
                                { number: content.stat2_num, label: content.stat2_lab },
                                { number: content.stat3_num, label: content.stat3_lab }
                            ].map((stat, i) => (
                                <motion.div 
                                    key={i}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 text-center transition-all hover:bg-white/10 hover:border-gold/30 shadow-lg"
                                >
                                    <div className="text-2xl md:text-4xl font-serif font-black gold-gradient-text mb-1.5 md:mb-2 drop-shadow-md">{stat.number}</div>
                                    <div className="text-[9px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Bottom CTA Section */}
            <section className="py-24 border-t border-white/5 relative mt-10">
                <div className="absolute inset-0 bg-gradient-to-t from-maroon/10 to-transparent -z-10" />
                <motion.div 
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto text-center px-4"
                >
                    <h2 className="text-2xl md:text-4xl font-serif font-bold text-white mb-4 md:mb-6">{content.cta_title}</h2>
                    <p className="text-base md:text-lg text-gray-400 mb-8 md:mb-10 font-light">{content.cta_desc}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href="/events" className="px-8 py-4 bg-gradient-to-r from-gold-light to-gold text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all">Explore Events Schedule</a>
                        <a href="/gallery" className="px-8 py-4 glass text-white font-semibold rounded-full hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all">View Media Gallery</a>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
