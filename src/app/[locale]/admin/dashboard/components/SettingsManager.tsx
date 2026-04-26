"use client";

import { useState, useEffect } from "react";
import { Save, Layout, Type, Image as ImageIcon, CheckCircle2, Upload, FileText, User, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [settings, setSettings] = useState<Record<string, string>>({
        hero_title: "",
        hero_subtitle: "",
        about_text: "",
        hero_image: "/poster.jpg",
        site_logo: "/logo.png",
        points_heading: "🏆 Final Status",
        about_heading: "Our Journey & Legacy",
        footer_text: "© 2026 Chapparapadavu Sahityotsav. All rights reserved.",
        about_image_1: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974",
        about_image_2: "/poster.jpg",
        events_title: "Events & Sessions",
        events_subtitle: "Discover the incredible competitions, talks, and performances lined up for the festival.",
        news_title: "News & Broadcast",
        news_subtitle: "Stay updated with live announcements, ongoing events, and festival highlights.",
        results_title: "Festival Results",
        results_subtitle: "Official standings and competition results from the Sahityotsav event.",
        program_schedule_pdf: "",
        stat_1_number: "32+",
        stat_1_label: "Years of Legacy",
        stat_2_number: "26",
        stat_2_label: "States Covered",
        stat_3_number: "5K+",
        stat_3_label: "Participants",
        admin_whatsapp: "7907406034",
        contact_title: "Reach Out",
        contact_subtitle: "Have questions about the festival? Our team is here to help you with everything from registrations to venue details.",
        map_iframe_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15603.964344426544!2d75.38575975!3d12.1127027!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba46cdbeaa2cbbb%3A0xb35a968fd1350a4e!2sChapparapadavu%2C%20Kerala!5e0!3m2!1sen!2sin!4v1709420000000!5m2!1sen!2sin",
        address_title: "Event Location",
        address_text: "Chapparapadavu, Kannur, Kerala 670581",
        committee_title: "Organizing Committee",
        instagram_url: "#",
        facebook_url: "#",
        youtube_url: "#",
        explore_1_title: "Live Results",
        explore_1_desc: "Check the real-time leaderboard and points table.",
        explore_1_href: "/points",
        explore_1_img: "https://images.unsplash.com/photo-1543854589-9b9eb2dd45d1?q=80&w=1974&auto=format&fit=crop",
        explore_2_title: "News & Updates",
        explore_2_desc: "Stay updated with latest announcements and schedules.",
        explore_2_href: "/news",
        explore_2_img: "https://images.unsplash.com/photo-1523580494112-071dcb85170d?q=80&w=1974&auto=format&fit=crop",
        explore_3_title: "Event Gallery",
        explore_3_desc: "Relive the magical moments and performances.",
        explore_3_href: "/gallery",
        explore_3_img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop",
        about_page_title: "Our Legacy",
        about_page_since: "Since 1993",
        about_page_p1: "Incepted 32 years ago in 1993, it has its commencement from the grassroot level -that is a family Sahityotsav. Crossing the levels of units,sectors, divisions,districts and 26 states in the country, it finds its actualization in the national level each year.",
        about_page_p2: "As a prime aim,Sahityotsav is focusing on the embellishment of the creativity of thousands and more students across the country, and now it became one of the towering figures in the realm Of cultural festivals of India.",
        about_page_p3: "Sahityotsav has its assets of thousands of young vibrant studentdom who have came forward to meet the need of the time in its various aspects. They are ready to question all the anti social hullabaloos using their talents like writing, drawing, criticizing... etc.",
        about_page_stat1_num: "32+",
        about_page_stat1_lab: "Years of Legacy",
        about_page_stat2_num: "26",
        about_page_stat2_lab: "States Covered",
        about_page_stat3_num: "5K+",
        about_page_stat3_lab: "Vibrant Students",
        about_page_cta_title: "Witness the Talent Unfold",
        about_page_cta_desc: "Join us in experiencing the towering figures of the realm of cultural festivals.",
        about_page_img1: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop",
        about_page_img2: "https://images.unsplash.com/photo-1543854589-9b9eb2dd45d1?q=80&w=1974&auto=format&fit=crop",
        about_page_img3: "https://images.unsplash.com/photo-1523580494112-071dcb85170d?q=80&w=1974&auto=format&fit=crop",
        about_page_img4: "/poster.jpg",
        poster_header: ""
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingField(field);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "settings");

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, [field]: data.fileUrl }));
                showToast("File uploaded successfully!", "success");
            } else {
                showToast("Upload failed", "error");
            }
        } catch (error) {
            showToast("Network error during upload", "error");
        } finally {
            setUploadingField(null);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                showToast("Site settings updated successfully!", "success");
            } else {
                showToast("Failed to save settings", "error");
            }
        } catch (error) {
            showToast("Network error", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-12 text-gray-400">Loading settings...</div>;

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Site Content Manager</h2>
                <p className="text-sm text-gray-400">Customize the text and appearance of your homepage and brand.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Branding Section */}
                <div className="space-y-4">
                    <h3 className="text-gold text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Layout size={16} /> Branding & Identity
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Site Logo</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={settings.site_logo}
                                    onChange={e => setSettings({...settings, site_logo: e.target.value})}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    placeholder="/logo.png"
                                />
                                <label className="flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl cursor-copy hover:border-gold/50 transition-colors">
                                    <Upload size={18} className={uploadingField === 'site_logo' ? 'animate-bounce' : ''} />
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'site_logo')} />
                                </label>
                            </div>
                            <p className="text-[10px] text-gray-500 italic">Upload to Media Gallery first, then copy the URL here.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Leaderboard Title</label>
                            <input 
                                type="text"
                                value={settings.points_heading}
                                onChange={e => setSettings({...settings, points_heading: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2 pt-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Result Poster Header (Logos/Top Bar)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={settings.poster_header}
                                    onChange={e => setSettings({...settings, poster_header: e.target.value})}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    placeholder="Upload an image with all logos/dates for the top of the poster"
                                />
                                <label className="flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl cursor-copy hover:border-gold/50 transition-colors">
                                    <Upload size={18} className={uploadingField === 'poster_header' ? 'animate-bounce' : ''} />
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'poster_header')} />
                                </label>
                            </div>
                            <p className="text-[10px] text-gray-500 italic">This banner (Logos+Event Info) will appear at the very top of Result Posters. Standard Size: 800x180px approx.</p>
                        </div>
                    </div>
                </div>



                {/* Contact Page Section */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-gold text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Type size={16} /> Contact Page Content
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Contact Title</label>
                            <input 
                                type="text"
                                value={settings.contact_title}
                                onChange={e => setSettings({...settings, contact_title: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Committee Title</label>
                            <input 
                                type="text"
                                value={settings.committee_title}
                                onChange={e => setSettings({...settings, committee_title: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Contact Subtitle</label>
                            <textarea 
                                value={settings.contact_subtitle}
                                onChange={e => setSettings({...settings, contact_subtitle: e.target.value})}
                                rows={2}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Google Maps Iframe URL</label>
                            <input 
                                type="text"
                                value={settings.map_iframe_url}
                                onChange={e => setSettings({...settings, map_iframe_url: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                placeholder="Paste the src from Google Maps embed code"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Address Title</label>
                            <input 
                                type="text"
                                value={settings.address_title}
                                onChange={e => setSettings({...settings, address_title: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Address Text</label>
                            <input 
                                type="text"
                                value={settings.address_text}
                                onChange={e => setSettings({...settings, address_text: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Instagram URL</label>
                            <input 
                                type="text"
                                value={settings.instagram_url}
                                onChange={e => setSettings({...settings, instagram_url: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Facebook URL</label>
                            <input 
                                type="text"
                                value={settings.facebook_url}
                                onChange={e => setSettings({...settings, facebook_url: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Youtube URL</label>
                            <input 
                                type="text"
                                value={settings.youtube_url}
                                onChange={e => setSettings({...settings, youtube_url: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Explore Highlights Section */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-gold text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={16} /> Explore Highlights
                    </h3>
                    <div className="space-y-8">
                        {/* Card 1 */}
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Card 1</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Title</label>
                                    <input 
                                        type="text"
                                        value={settings.explore_1_title}
                                        onChange={e => setSettings({...settings, explore_1_title: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Link URL</label>
                                    <input 
                                        type="text"
                                        value={settings.explore_1_href}
                                        onChange={e => setSettings({...settings, explore_1_href: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>
                                    <input 
                                        type="text"
                                        value={settings.explore_1_desc}
                                        onChange={e => setSettings({...settings, explore_1_desc: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Image URL</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            value={settings.explore_1_img}
                                            onChange={e => setSettings({...settings, explore_1_img: e.target.value})}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                        />
                                        <label className="flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl cursor-copy hover:border-gold/50 transition-colors">
                                            <Upload size={18} className={uploadingField === 'explore_1_img' ? 'animate-bounce' : ''} />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'explore_1_img')} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Card 2</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Title</label>
                                    <input 
                                        type="text"
                                        value={settings.explore_2_title}
                                        onChange={e => setSettings({...settings, explore_2_title: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Link URL</label>
                                    <input 
                                        type="text"
                                        value={settings.explore_2_href}
                                        onChange={e => setSettings({...settings, explore_2_href: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>
                                    <input 
                                        type="text"
                                        value={settings.explore_2_desc}
                                        onChange={e => setSettings({...settings, explore_2_desc: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Image URL</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            value={settings.explore_2_img}
                                            onChange={e => setSettings({...settings, explore_2_img: e.target.value})}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                        />
                                        <label className="flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl cursor-copy hover:border-gold/50 transition-colors">
                                            <Upload size={18} className={uploadingField === 'explore_2_img' ? 'animate-bounce' : ''} />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'explore_2_img')} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Card 3</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Title</label>
                                    <input 
                                        type="text"
                                        value={settings.explore_3_title}
                                        onChange={e => setSettings({...settings, explore_3_title: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Link URL</label>
                                    <input 
                                        type="text"
                                        value={settings.explore_3_href}
                                        onChange={e => setSettings({...settings, explore_3_href: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>
                                    <input 
                                        type="text"
                                        value={settings.explore_3_desc}
                                        onChange={e => setSettings({...settings, explore_3_desc: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Image URL</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            value={settings.explore_3_img}
                                            onChange={e => setSettings({...settings, explore_3_img: e.target.value})}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                        />
                                        <label className="flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl cursor-copy hover:border-gold/50 transition-colors">
                                            <Upload size={18} className={uploadingField === 'explore_3_img' ? 'animate-bounce' : ''} />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'explore_3_img')} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-gold text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Type size={16} /> Hero Section Content
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Main Title (Hero)</label>
                            <input 
                                type="text"
                                value={settings.hero_title}
                                onChange={e => setSettings({...settings, hero_title: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                placeholder="Grand Chapparapadavu Sahityotsav"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Hero Subtitle</label>
                            <textarea 
                                value={settings.hero_subtitle}
                                onChange={e => setSettings({...settings, hero_subtitle: e.target.value})}
                                rows={2}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50 resize-none"
                                placeholder="A celebration of culture and art..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Featured Hero Image</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={settings.hero_image}
                                    onChange={e => setSettings({...settings, hero_image: e.target.value})}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    placeholder="/poster.jpg"
                                />
                                <label className="flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl cursor-copy hover:border-gold/50 transition-colors">
                                    <Upload size={18} className={uploadingField === 'hero_image' ? 'animate-bounce' : ''} />
                                    <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'hero_image')} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Program Schedule Section */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-gold text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} /> Program Schedule
                    </h3>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase">Program Schedule PDF</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={settings.program_schedule_pdf}
                                onChange={e => setSettings({...settings, program_schedule_pdf: e.target.value})}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                placeholder="/schedule.pdf"
                            />
                            {settings.program_schedule_pdf && (
                                <a 
                                    href={settings.program_schedule_pdf} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl text-gold hover:bg-gold/10 transition-colors"
                                    title="View Current PDF"
                                >
                                    <FileText size={18} />
                                </a>
                            )}
                            <label className="flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl cursor-copy hover:border-gold/50 transition-colors">
                                <Upload size={18} className={uploadingField === 'program_schedule_pdf' ? 'animate-bounce' : ''} />
                                <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'program_schedule_pdf')} />
                            </label>
                        </div>
                        <p className="text-[10px] text-gray-500 italic">Upload the official program schedule PDF here.</p>
                    </div>
                </div>

                {/* About Section */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-gold text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={16} /> Story & About Section
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">About Section Heading</label>
                            <input 
                                type="text"
                                value={settings.about_heading}
                                onChange={e => setSettings({...settings, about_heading: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">About Chapter Story</label>
                            <textarea 
                                value={settings.about_text}
                                onChange={e => setSettings({...settings, about_text: e.target.value})}
                                rows={6}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                placeholder="Share the history and legacy of the festival..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">About Image 1 (Left/Small)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={settings.about_image_1}
                                        onChange={e => setSettings({...settings, about_image_1: e.target.value})}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    />
                                    <label className="flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl cursor-copy hover:border-gold/50 transition-colors">
                                        <Upload size={18} className={uploadingField === 'about_image_1' ? 'animate-bounce' : ''} />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'about_image_1')} />
                                    </label>
                                    <button 
                                        onClick={() => setSettings({...settings, about_image_1: ""})}
                                        className="flex items-center justify-center p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition-colors"
                                        title="Remove Image"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">About Image 2 (Right/Main)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={settings.about_image_2}
                                        onChange={e => setSettings({...settings, about_image_2: e.target.value})}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    />
                                    <label className="flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl cursor-copy hover:border-gold/50 transition-colors">
                                        <Upload size={18} className={uploadingField === 'about_image_2' ? 'animate-bounce' : ''} />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'about_image_2')} />
                                    </label>
                                    <button 
                                        onClick={() => setSettings({...settings, about_image_2: ""})}
                                        className="flex items-center justify-center p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition-colors"
                                        title="Remove Image"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Section */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-gold text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Layout size={16} /> Interactive Statistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Stat 1 Number</label>
                                <input 
                                    type="text"
                                    value={settings.stat_1_number}
                                    onChange={e => setSettings({...settings, stat_1_number: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    placeholder="32+"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Stat 1 Label</label>
                                <input 
                                    type="text"
                                    value={settings.stat_1_label}
                                    onChange={e => setSettings({...settings, stat_1_label: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    placeholder="Years of Legacy"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Stat 2 Number</label>
                                <input 
                                    type="text"
                                    value={settings.stat_2_number}
                                    onChange={e => setSettings({...settings, stat_2_number: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    placeholder="26"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Stat 2 Label</label>
                                <input 
                                    type="text"
                                    value={settings.stat_2_label}
                                    onChange={e => setSettings({...settings, stat_2_label: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    placeholder="States Covered"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Stat 3 Number</label>
                                <input 
                                    type="text"
                                    value={settings.stat_3_number}
                                    onChange={e => setSettings({...settings, stat_3_number: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    placeholder="5K+"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Stat 3 Label</label>
                                <input 
                                    type="text"
                                    value={settings.stat_3_label}
                                    onChange={e => setSettings({...settings, stat_3_label: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                    placeholder="Participants"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* About Page Detailed Content */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-gold text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <User size={16} /> About Page Content
                    </h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Page Title</label>
                                <input 
                                    type="text"
                                    value={settings.about_page_title}
                                    onChange={e => setSettings({...settings, about_page_title: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Legacy Text (e.g. Since 1993)</label>
                                <input 
                                    type="text"
                                    value={settings.about_page_since}
                                    onChange={e => setSettings({...settings, about_page_since: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Paragraph 1</label>
                            <textarea 
                                value={settings.about_page_p1}
                                onChange={e => setSettings({...settings, about_page_p1: e.target.value})}
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Paragraph 2</label>
                            <textarea 
                                value={settings.about_page_p2}
                                onChange={e => setSettings({...settings, about_page_p2: e.target.value})}
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Paragraph 3</label>
                            <textarea 
                                value={settings.about_page_p3}
                                onChange={e => setSettings({...settings, about_page_p3: e.target.value})}
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Stat 1</label>
                                <input type="text" value={settings.about_page_stat1_num} onChange={e => setSettings({...settings, about_page_stat1_num: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gold" />
                                <input type="text" value={settings.about_page_stat1_lab} onChange={e => setSettings({...settings, about_page_stat1_lab: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-gray-400" />
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Stat 2</label>
                                <input type="text" value={settings.about_page_stat2_num} onChange={e => setSettings({...settings, about_page_stat2_num: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gold" />
                                <input type="text" value={settings.about_page_stat2_lab} onChange={e => setSettings({...settings, about_page_stat2_lab: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-gray-400" />
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Stat 3</label>
                                <input type="text" value={settings.about_page_stat3_num} onChange={e => setSettings({...settings, about_page_stat3_num: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gold" />
                                <input type="text" value={settings.about_page_stat3_lab} onChange={e => setSettings({...settings, about_page_stat3_lab: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-gray-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">CTA Heading</label>
                                <input 
                                    type="text"
                                    value={settings.about_page_cta_title}
                                    onChange={e => setSettings({...settings, about_page_cta_title: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">CTA Description</label>
                                <input 
                                    type="text"
                                    value={settings.about_page_cta_desc}
                                    onChange={e => setSettings({...settings, about_page_cta_desc: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                                />
                            </div>
                        </div>

                        {/* About Page Image Grid */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="text-[10px] font-bold text-gold/60 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon size={12} /> About Page Image Grid
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map((num) => (
                                    <div key={num} className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold text-gray-400">Grid Image {num}</label>
                                            <button 
                                                onClick={() => setSettings({...settings, [`about_page_img${num}`]: ""})}
                                                className="text-red-500 hover:text-red-400 transition-colors p-1"
                                                title="Remove Image"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text"
                                                value={settings[`about_page_img${num}`]}
                                                onChange={e => setSettings({...settings, [`about_page_img${num}`]: e.target.value})}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-gray-300 outline-none focus:border-gold/50"
                                                placeholder={`Image ${num} URL`}
                                            />
                                            <label className="flex items-center justify-center p-2 bg-white/5 border border-white/10 rounded-xl cursor-copy hover:border-gold/50 transition-colors shrink-0">
                                                <Upload size={14} className={uploadingField === `about_page_img${num}` ? 'animate-bounce' : ''} />
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, `about_page_img${num}`)} />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-gold text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Save size={16} /> Footer & Additional Details
                    </h3>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase">Footer Copyright Text</label>
                        <input 
                            type="text"
                            value={settings.footer_text}
                            onChange={e => setSettings({...settings, footer_text: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase">Admin WhatsApp & Contact</label>
                        <input 
                            type="text"
                            value={settings.admin_whatsapp}
                            onChange={e => setSettings({...settings, admin_whatsapp: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50"
                            placeholder="9496079128"
                        />
                        <p className="text-[10px] text-gray-500 italic">This number will be displayed on the contact page and used for official inquiries.</p>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-gold-light to-gold text-black rounded-xl font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50"
                    >
                        {saving ? "Updating Site..." : (
                            <>
                                <Save size={18} />
                                Save & Publish Changes
                            </>
                        )}
                    </button>
                    <p className="mt-4 text-[10px] text-gray-500 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Changes will be visible to all users immediately after saving.
                    </p>
                </div>
            </form>
        </div>
    );
}
