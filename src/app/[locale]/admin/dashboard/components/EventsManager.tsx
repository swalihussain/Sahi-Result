"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Calendar, Trash2, Edit2, X, Save, Edit3, Image as ImageIcon } from "lucide-react";

interface Event {
    id: number;
    title: string;
    date: string;
    description: string;
    image_url?: string;
    created_at?: string;
}

export default function EventsManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    
    const [formData, setFormData] = useState({
        title: "",
        date: "",
        description: "",
        image_url: "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [pageSettings, setPageSettings] = useState({
        events_title: "Events & Sessions",
        events_subtitle: "Discover the incredible competitions, talks, and performances lined up for the festival."
    });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetch("/api/settings").then(res => res.json()).then(data => {
            if (data.events_title || data.events_subtitle) {
                setPageSettings({
                    events_title: data.events_title || "Events & Sessions",
                    events_subtitle: data.events_subtitle || "Discover the incredible competitions, talks, and performances lined up for the festival."
                });
            }
        });
    }, []);

    const handleSavePageSettings = async () => {
        setSavingSettings(true);
        try {
            await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pageSettings)
            });
            showToast("Events page header updated!", "success");
        } catch {
            showToast("Failed to update header", "error");
        } finally {
            setSavingSettings(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events");
            if (res.ok) {
                const data = await res.json();
                setEvents(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    const handleEdit = (event: Event) => {
        setEditingId(event.id);
        setFormData({
            title: event.title,
            date: event.date,
            description: event.description || "",
            image_url: event.image_url || "",
        });
        setImageFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        
        try {
            const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
            if (res.ok) {
                showToast("Event deleted", "success");
                fetchEvents();
            }
        } catch {
            showToast("Failed to delete event", "error");
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ title: "", date: "", description: "", image_url: "" });
        setImageFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalImageUrl = formData.image_url;

            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append("file", imageFile);
                uploadData.append("folder", "event-images");

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadData,
                });

                if (uploadRes.ok) {
                    const uploadResult = await uploadRes.json();
                    finalImageUrl = uploadResult.fileUrl;
                } else {
                    const errorData = await uploadRes.json();
                    showToast(errorData.error || "Failed to upload image", "error");
                    setLoading(false);
                    return;
                }
            }

            const url = editingId ? `/api/events/${editingId}` : "/api/events";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, image_url: finalImageUrl }),
            });

            if (res.ok) {
                showToast(editingId ? "Event updated" : "Event created", "success");
                resetForm();
                fetchEvents();
            } else {
                const errorData = await res.json();
                showToast(errorData.error || "Failed to save event", "error");
            }
        } catch {
            showToast("A network error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-12">
            {/* Page Header Editor */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Edit3 size={18} className="text-gold" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Edit Events Page Header</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Page Title</label>
                        <input 
                            type="text"
                            value={pageSettings.events_title}
                            onChange={e => setPageSettings({...pageSettings, events_title: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                        />
                    </div>
                    <div className="space-y-1 flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Page Subtitle</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={pageSettings.events_subtitle}
                                onChange={e => setPageSettings({...pageSettings, events_subtitle: e.target.value})}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-white mb-2">
                            {editingId ? "Edit Event" : "Create New Event"}
                        </h2>
                        <p className="text-sm text-gray-400">Manage competition and session details.</p>
                    </div>
                    {editingId && (
                        <button onClick={resetForm} className="p-2 glass rounded-full hover:bg-white/10 text-gray-400">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Event Title</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                            placeholder="e.g. Inauguration Ceremony"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Date & Time</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                                <Calendar size={16} />
                            </div>
                            <input
                                required
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                                placeholder="March 15, 10:00 AM"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Event Image</label>
                        <div className="flex flex-col gap-3">
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gold/10 file:text-gold"
                            />
                            {formData.image_url && !imageFile && (
                                <div className="text-[10px] text-gray-500 italic">Current image: {formData.image_url.split('/').pop()}</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Description (Optional)</label>
                        <textarea
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors min-h-[100px]"
                            placeholder="Briefly describe the event..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {editingId ? <Save size={18} /> : <PlusCircle size={18} />}
                        {loading ? "Saving..." : editingId ? "Update Event" : "Create Event"}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="w-full py-2 text-sm text-gray-500 hover:text-white transition-colors"
                        >
                            Cancel Edit
                        </button>
                    )}
                </form>
            </motion.div>

            <div className="space-y-6">
                <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                    Manual Events
                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full font-sans text-gray-400">{events.length}</span>
                </h3>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {events.map((event) => (
                        <div key={event.id} className="glass-card !p-4 flex items-center gap-4 group hover:border-gold/30 transition-all">
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 bg-gold/5 flex items-center justify-center">
                                {event.image_url ? (
                                    <img src={event.image_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <Calendar size={24} className="text-gold/20" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-sm truncate">{event.title}</h4>
                                <p className="text-xs text-gray-500">{event.date}</p>
                                {event.description && (
                                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{event.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => handleEdit(event)}
                                    className="p-2 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-lg transition-all"
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(event.id)}
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                            No manual events added yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);
}
