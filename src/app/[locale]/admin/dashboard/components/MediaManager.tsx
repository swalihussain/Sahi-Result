"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon, Copy, Check, Trash2, Edit3, Save } from "lucide-react";

export default function MediaManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [gallery, setGallery] = useState<string[]>([]);
    
    const [pageSettings, setPageSettings] = useState({
        gallery_title: "Moments of Sahityotsav",
        gallery_subtitle: "Relive the incredible performances and memorable moments from the festival highlights."
    });
    const [savingSettings, setSavingSettings] = useState(false);
    
    const fetchGallery = async () => {
        try {
            const res = await fetch('/api/gallery');
            if (res.ok) {
                const data = await res.json();
                setGallery(data);
            }
        } catch (e) {
            console.error("Failed to load gallery");
        }
    };
    
    // Fetch on initial load
    useEffect(() => {
        fetchGallery();
        fetch("/api/settings").then(res => res.json()).then(data => {
            if (data.gallery_title || data.gallery_subtitle) {
                setPageSettings({
                    gallery_title: data.gallery_title || "Moments of Sahityotsav",
                    gallery_subtitle: data.gallery_subtitle || "Relive the incredible performances and memorable moments from the festival highlights."
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
            showToast("Gallery page header updated!", "success");
        } catch {
            showToast("Failed to update header", "error");
        } finally {
            setSavingSettings(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            showToast("Please select a file first", "error");
            return;
        }

        setLoading(true);
        setUploadedUrl(null);
        setCopied(false);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "gallery");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setUploadedUrl(data.fileUrl);
                showToast("Media uploaded successfully!", "success");
                setFile(null);
                fetchGallery(); // refresh gallery
            } else {
                showToast(data.error || "Failed to upload media", "error");
            }
        } catch (err) {
            showToast("A network error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteImage = async (url: string) => {
        if (!confirm("Are you sure you want to completely remove this image?")) return;
        
        try {
            const res = await fetch("/api/gallery", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            if (res.ok) {
                showToast("Image deleted successfully", "success");
                if (uploadedUrl === url) {
                    setUploadedUrl(null);
                }
                fetchGallery(); // Refresh list immediately
            } else {
                showToast("Failed to delete image", "error");
            }
        } catch {
            showToast("A network error occurred", "error");
        }
    };

    const copyToClipboard = () => {
        if (uploadedUrl) {
            navigator.clipboard.writeText(uploadedUrl);
            setCopied(true);
            showToast("URL copied to clipboard!", "success");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl space-y-12">
            {/* Page Header Editor */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Edit3 size={18} className="text-gold" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Edit Gallery Page Header</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Page Title</label>
                        <input 
                            type="text"
                            value={pageSettings.gallery_title}
                            onChange={e => setPageSettings({...pageSettings, gallery_title: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                        />
                    </div>
                    <div className="space-y-1 flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Page Subtitle</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={pageSettings.gallery_subtitle}
                                onChange={e => setPageSettings({...pageSettings, gallery_subtitle: e.target.value})}
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

            <div className="max-w-xl">
            <div className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Media Gallery Uploader</h2>
                <p className="text-sm text-gray-400">Upload images or documents to get a public URL for use across the website.</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Select Media File</label>
                    <div className="relative">
                        <input
                            key={file ? "selected" : "empty"}
                            type="file"
                            accept="image/*,video/*,.pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-8 text-center text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                        />
                    </div>
                    {file && (
                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                            <Check size={12} /> {file.name} selected ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !file}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-gold-light to-gold text-black rounded-xl font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>Uploading...</>
                    ) : (
                        <>
                            <Upload size={18} className="text-black" />
                            Upload to Server
                        </>
                    )}
                </button>
            </form>

            {uploadedUrl && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 border border-green-500/30 bg-green-900/10 rounded-xl"
                >
                    <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                        <Check size={18} /> Upload Successful
                    </h3>
                    
                    {uploadedUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-white/10 max-w-xs">
                            <img src={uploadedUrl} alt="Uploaded Media Preview" className="w-full h-auto object-cover" />
                        </div>
                    )}
                    {uploadedUrl.match(/\.(mp4|webm|ogg)$/i) && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-white/10 max-w-xs">
                            <video src={uploadedUrl} className="w-full h-auto object-cover" controls />
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Public URL</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text"
                                readOnly
                                value={uploadedUrl}
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none"
                            />
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(uploadedUrl);
                                    showToast("URL copied to clipboard!", "success");
                                }}
                                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10"
                                title="Copy URL"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {gallery.length > 0 && (
                <div className="mt-12">
                    <h3 className="text-lg font-serif font-bold text-white mb-4 border-b border-white/10 pb-2">Uploaded Images ({gallery.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {gallery.map(url => {
                            const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                            return (
                                <div key={url} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square bg-black/40 flex items-center justify-center">
                                    {isVideo ? (
                                        <video src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105" muted loop playsInline onMouseOver={e => (e.target as HTMLVideoElement).play().catch(()=>{})} onMouseOut={e => (e.target as HTMLVideoElement).pause()} />
                                    ) : (
                                        <img src={url} alt="Gallery Image" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(url);
                                            showToast("URL copied!", "success");
                                        }}
                                        className="bg-gold/20 hover:bg-gold/40 text-gold border border-gold/30 py-1.5 rounded-full transition-colors flex items-center justify-center gap-2 text-xs font-bold w-28"
                                    >
                                        <Copy size={14} /> Copy URL
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteImage(url)}
                                        className="bg-red-500/20 hover:bg-red-500/40 text-red-500 border border-red-500/30 py-1.5 rounded-full transition-colors flex items-center justify-center gap-2 text-xs font-bold w-28"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            )}
            </div>
        </motion.div>
    );
}
