"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';

interface Event {
    id: number;
    title: string;
    date: string;
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
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const filteredEvents = events;

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
                        No events scheduled yet.
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
                        <div className="aspect-video bg-gold/5 flex items-center justify-center border-b border-white/5 group-hover:bg-gold/10 transition-colors">
                            <Calendar size={64} className="text-gold/20 group-hover:text-gold/40 transition-all duration-500" />
                        </div>

                        <div className="p-6">
                            <div className="text-gold text-sm font-medium mb-2">{event.date}</div>
                            <h3 className="text-xl font-bold mb-4 font-serif line-clamp-2">{event.title}</h3>

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
                            className="w-full max-w-2xl glass-card relative z-10 !p-8 overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="text-gold font-bold uppercase tracking-widest text-xs mb-2">{selectedEvent.date}</div>
                                    <h2 className="text-3xl font-serif font-bold text-white">{selectedEvent.title}</h2>
                                </div>
                                <button 
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-2 hover:bg-white/5 text-gray-400 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                {selectedEvent.description || "No details available for this event."}
                            </div>
                            
                            <div className="mt-8 flex justify-end">
                                <button 
                                    onClick={() => setSelectedEvent(null)}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default EventsList;
