"use client";

import { useState, useEffect } from "react";
import * as motion from "framer-motion/client";
import { Bell, MapPin, CalendarClock, Trash2, Radio, Edit3, Save } from "lucide-react";

export default function AnnouncementsManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [loading, setLoading] = useState(false);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        type: "Ongoing Event",
        stage_number: "",
        date: "",
    });
    const [pageSettings, setPageSettings] = useState({
        news_title: "News & Broadcast",
        news_subtitle: "Stay updated with live announcements, ongoing events, and festival highlights."
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const fetchAnnouncements = async () => {
        const res = await fetch("/api/announcements");
        if (res.ok) {
            setAnnouncements(await res.json());
        }
    };

    useEffect(() => {
        // Init with current date string
        const now = new Date();
        const formattedDate = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        setFormData(prev => ({ ...prev, date: formattedDate }));
        
        fetchAnnouncements();
        fetch("/api/settings").then(res => res.json()).then(data => {
            if (data.news_title || data.news_subtitle) {
                setPageSettings({
                    news_title: data.news_title || "News & Broadcast",
                    news_subtitle: data.news_subtitle || "Stay updated with live announcements, ongoing events, and festival highlights."
                });
            }
        });
    }, []);

    const handleSavePageSettings = async () => {
        setSavingSettings(true);
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pageSettings)
            });
            if (res.ok) showToast("Page header updated!", "success");
        } catch {
            showToast("Failed to update header", "error");
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                showToast("Announcement broadcasted live!", "success");
                const now = new Date();
                const formattedDate = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                
                setFormData({ title: "", type: "Ongoing Event", stage_number: "", date: formattedDate });
                fetchAnnouncements();
            } else {
                const data = await res.json();
                showToast(data.message || "Failed to broadcast", "error");
            }
        } catch {
            showToast("A network error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this announcement?")) return;
        
        try {
            const res = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast("Announcement deleted successfully", "success");
                fetchAnnouncements();
            } else {
                showToast("Failed to delete", "error");
            }
        } catch {
            showToast("Network error", "error");
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl space-y-12">
            {/* Page Header Editor */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Edit3 size={18} className="text-gold" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Edit News Page Header</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Page Title</label>
                        <input 
                            type="text"
                            value={pageSettings.news_title}
                            onChange={e => setPageSettings({...pageSettings, news_title: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                        />
                    </div>
                    <div className="space-y-1 flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Page Subtitle</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={pageSettings.news_subtitle}
                                onChange={e => setPageSettings({...pageSettings, news_subtitle: e.target.value})}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                            />
                            <button 
                                onClick={handleSavePageSettings}
                                disabled={savingSettings}
                                className="px-4 bg-gold/10 hover:bg-gold/20 text-gold rounded-xl border border-gold/30 transition-all disabled:opacity-50"
                            >
                                {savingSettings ? "..." : <Save size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Form Section */}
            <div>
                <div className="mb-8">
                    <h2 className="text-2xl font-serif font-bold text-white mb-2">News Broadcast</h2>
                    <p className="text-sm text-gray-400">Push live updates for ongoing events and upcoming competitions directly to the homepage.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Announcement Type</label>
                        <select
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors appearance-none"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="Ongoing Event">Ongoing Event</option>
                            <option value="Upcoming Competition">Upcoming Competition</option>
                            <option value="Important Update">Important Update</option>
                            <option value="Result Declared">Result Declared</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Message / Details</label>
                        <div className="relative">
                            <div className="absolute top-3.5 left-3 flex items-start pointer-events-none text-gray-500">
                                <Radio size={16} />
                            </div>
                            <textarea
                                required
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-gold transition-colors resize-none"
                                placeholder="e.g. Duffmuttu competition will start in 15 minutes."
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300">Stage Number (Optional)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                                    <MapPin size={16} />
                                </div>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                                    placeholder="e.g. Stage 1"
                                    value={formData.stage_number}
                                    onChange={(e) => setFormData({ ...formData, stage_number: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300">Timestamp</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                                    <CalendarClock size={16} />
                                </div>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-gold-light to-gold text-black rounded-xl font-bold transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)]"
                    >
                        <Bell size={18} className="text-black" />
                        {loading ? "Broadcasting..." : "Broadcast Announcement"}
                    </button>
                </form>
            </div>

            {/* List Section */}
            <div>
                <div className="mb-6 flex justify-between items-end">
                    <h3 className="text-lg font-bold text-white font-serif">Live Board</h3>
                    <span className="text-xs text-gold uppercase tracking-widest font-semibold">{announcements.length} Active</span>
                </div>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {announcements.length === 0 ? (
                        <div className="text-center py-10 glass rounded-xl border-dashed border-white/10">
                            <p className="text-sm text-gray-500 font-medium">No active announcements</p>
                        </div>
                    ) : (
                        announcements.map((ann) => (
                            <div key={ann.id} className="glass p-4 rounded-xl border border-white/5 relative group hover:border-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                                        {ann.type}
                                    </span>
                                    <button 
                                        onClick={() => handleDelete(ann.id)}
                                        className="text-red-400/50 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <p className="text-white font-medium text-sm leading-snug mb-3">
                                    {ann.title}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                                    {ann.stage_number && (
                                        <div className="flex items-center gap-1">
                                            <MapPin size={12} className="text-gray-500" />
                                            {ann.stage_number}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <CalendarClock size={12} className="text-gray-500" />
                                        {ann.date}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
        </motion.div>
    );
}
