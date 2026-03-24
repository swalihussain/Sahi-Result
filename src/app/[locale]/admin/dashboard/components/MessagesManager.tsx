"use client";

import { useState, useEffect } from "react";
import { Mail, Trash2, CheckCircle, Clock, Search, MessageSquare, Phone, User, Send, MessageCircle } from "lucide-react";
import * as motion from "framer-motion/client";
import { AnimatePresence } from "framer-motion";

interface Message {
    id: number;
    name: string;
    phone: string;
    email: string;
    message: string;
    status: 'unread' | 'read' | 'replied';
    created_at: string;
}

export default function MessagesManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/contact");
            if (res.ok) {
                const data = await res.json();
                setMessages(Array.isArray(data) ? data : []);
            } else if (res.status === 401) {
                setError("Unauthorized: Please log in again.");
            } else {
                setError("Failed to load messages from server.");
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
            setError("Network error: Could not reach the server.");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: number, status: 'read' | 'unread' | 'replied') => {
        try {
            const res = await fetch("/api/contact", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status })
            });
            if (res.ok) {
                setMessages(messages.map(m => m.id === id ? { ...m, status } : m));
                showToast(`Message marked as ${status}`, "success");
            }
        } catch (error) {
            showToast("Failed to update status", "error");
        }
    };

    const deleteMessage = async (id: number) => {
        if (!confirm("Are you sure you want to delete this message?")) return;
        try {
            const res = await fetch(`/api/contact?id=${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setMessages(messages.filter(m => m.id !== id));
                showToast("Message deleted", "success");
            }
        } catch (error) {
            showToast("Failed to delete message", "error");
        }
    };

    const handleReply = (msg: Message, type: 'whatsapp' | 'email') => {
        const text = encodeURIComponent(replyText);
        if (type === 'whatsapp') {
            const phone = msg.phone.replace(/\D/g, '');
            const url = `https://wa.me/${phone}?text=${text}`;
            window.open(url, '_blank');
        } else {
            const url = `mailto:${msg.email}?subject=Reply from Sahityotsav&body=${text}`;
            window.open(url, '_blank');
        }
        updateStatus(msg.id, 'replied');
        setReplyingTo(null);
        setReplyText("");
    };

    const filteredMessages = messages.filter(m => 
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.message.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                <Clock className="animate-spin text-gold" size={32} />
                <p>Loading messages...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 glass-card">
                <Clock className="mx-auto text-red-500 mb-4" size={48} />
                <h3 className="text-lg font-bold text-white mb-2">{error}</h3>
                <button 
                    onClick={fetchMessages}
                    className="mt-4 px-6 py-2 bg-gold/10 text-gold border border-gold/20 rounded-xl hover:bg-gold/20 transition-all font-bold"
                >
                    Retry Login / Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="text-gold" size={24} />
                        <h2 className="text-2xl font-serif font-bold text-white">User Messages</h2>
                    </div>
                    <p className="text-sm text-gray-400">Manage inquiries received from the contact form.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text"
                            placeholder="Search messages..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 outline-none focus:border-gold/50"
                        />
                    </div>
                    <button 
                        onClick={fetchMessages}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-400 hover:text-gold transition-all"
                        title="Refresh"
                    >
                        <Clock size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredMessages.length === 0 ? (
                    <div className="text-center py-20 glass-card bg-white/5 border border-dashed border-white/10">
                        <MessageSquare className="mx-auto text-gray-600 mb-4" size={48} />
                        <p className="text-gray-400 font-medium">No inquiries found.</p>
                        {search && <p className="text-xs text-gray-500 mt-2">Try clearing your search: "{search}"</p>}
                        {!search && <button onClick={fetchMessages} className="mt-4 text-xs text-gold hover:underline">Check for updates</button>}
                    </div>
                ) : (
                    filteredMessages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`glass-card relative overflow-hidden group border-l-4 ${
                                msg.status === 'unread' ? 'border-l-gold bg-gold/5' : 
                                msg.status === 'replied' ? 'border-l-blue-500 bg-blue-500/5' : 'border-l-transparent'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2 text-gold-light font-bold">
                                            <User size={16} />
                                            {msg.name}
                                            {msg.status === 'replied' && (
                                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Replied</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <Mail size={16} />
                                            {msg.email}
                                        </div>
                                        {msg.phone && (
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <Phone size={16} />
                                                {msg.phone}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-widest ml-auto font-bold">
                                            <Clock size={12} />
                                            {new Date(msg.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap italic">
                                        "{msg.message}"
                                    </p>
                                </div>
                                <div className="flex md:flex-col gap-2 justify-end">
                                    <button 
                                        onClick={() => {
                                            setReplyingTo(replyingTo === msg.id ? null : msg.id);
                                            setReplyText(`Hello ${msg.name},\n\nThank you for reaching out to Chapparapadavu Sahityotsav. `);
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${replyingTo === msg.id ? 'bg-gold text-black' : 'bg-gold/10 text-gold hover:bg-gold/20'}`}
                                        title="Reply"
                                    >
                                        <Send size={18} />
                                    </button>
                                    {msg.status === 'unread' ? (
                                        <button 
                                            onClick={() => updateStatus(msg.id, 'read')}
                                            className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
                                            title="Mark as Read"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => updateStatus(msg.id, 'unread')}
                                            className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                                            title="Mark as Unread"
                                        >
                                            <Clock size={18} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => deleteMessage(msg.id)}
                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                        title="Delete Message"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {replyingTo === msg.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-6 pt-6 border-t border-white/10"
                                    >
                                        <textarea 
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            rows={4}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gold/50 resize-none mb-4"
                                            placeholder="Write your reply here..."
                                        />
                                        <div className="flex flex-wrap gap-3">
                                            <button 
                                                onClick={() => handleReply(msg, 'email')}
                                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                                            >
                                                <Mail size={16} />
                                                Reply via Email
                                            </button>
                                            {msg.phone && (
                                                <button 
                                                    onClick={() => handleReply(msg, 'whatsapp')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400 hover:bg-green-500/20 transition-all"
                                                >
                                                    <MessageCircle size={16} />
                                                    Reply via WhatsApp
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setReplyingTo(null)}
                                                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
