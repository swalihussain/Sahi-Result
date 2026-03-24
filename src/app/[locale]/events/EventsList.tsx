"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { ExternalLink, X } from 'lucide-react';

interface Event {
    id: number;
    name: string;
    category: string;
    date: string;
    template_image?: string;
    description?: string;
}

interface EventsListProps {
    initialTitle: string;
    initialSubtitle: string;
    events: Event[];
    translations: {
        filterAll: string;
        filterLiterary: string;
        filterCultural: string;
        filterSports: string;
        viewDetails: string;
    };
}

function EventsList({ initialTitle, initialSubtitle, events, translations }: EventsListProps) {
    const [filter, setFilter] = useState('All');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const filteredEvents = events;

    const filters = [
        { label: translations.filterAll, value: 'All' },
        { label: translations.filterLiterary, value: 'Literary' },
        { label: translations.filterCultural, value: 'Cultural' },
        { label: translations.filterSports, value: 'Sports' }
    ];

    return (
        <div className="min-h-screen pt-32 pb-24 px-5 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{initialTitle}</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">{initialSubtitle}</p>
            </motion.div>


            {/* Grid */}
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {filteredEvents.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-500">
                        No events found in this category.
                    </div>
                ) : null}
                {filteredEvents.map((event, i) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        key={event.id}
                        className="group glass-card overflow-hidden !p-0"
                    >
                        <div className="aspect-video overflow-hidden relative">
                            {event.template_image?.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video 
                                    src={event.template_image}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <img
                                    src={event.template_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop'}
                                    alt={event.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            )}
                        </div>

                        <div className="p-6">
                            <div className="text-gold text-sm font-medium mb-2">{event.date}</div>
                            <h3 className="text-xl font-bold mb-4 font-serif">{event.name}</h3>

                            <div className="flex items-center justify-between">
                                <button 
                                    onClick={() => setSelectedEvent(event)}
                                    className="text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    {translations.viewDetails}
                                </button>
                                
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Description Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEvent(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-2xl glass-card relative z-10 !p-0 overflow-hidden"
                        >
                            <div className="aspect-video w-full relative">
                                {selectedEvent.template_image?.match(/\.(mp4|webm|ogg)$/i) ? (
                                    <video 
                                        src={selectedEvent.template_image}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src={selectedEvent.template_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop'}
                                        alt={selectedEvent.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <button 
                                    onClick={() => setSelectedEvent(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-8">
                                <h2 className="text-3xl font-serif font-bold mb-6 text-white">{selectedEvent.name}</h2>
                                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                                    {selectedEvent.description || "No details available for this event yet."}
                                </div>
                                
                                <div className="mt-8 flex justify-end gap-3">
                                    <button 
                                        onClick={() => setSelectedEvent(null)}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default EventsList;
