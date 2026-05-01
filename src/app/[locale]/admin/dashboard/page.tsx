"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Trophy, LogOut, Settings, Bell, Upload, CalendarDays, Award, Mail, Menu, X as CloseIcon, MessageSquare } from 'lucide-react';
import { Link } from '@/i18n/routing';
import EventsManager from './components/EventsManager';
import TeamsManager from './components/TeamsManager';
import ResultsManager from './components/ResultsManager';
import MediaManager from './components/MediaManager';
import AnnouncementsManager from './components/AnnouncementsManager';
import StatusManager from './components/StatusManager';
import SettingsManager from './components/SettingsManager';
import MessagesManager from './components/MessagesManager';
import dynamic from 'next/dynamic';

const JudgesManager = dynamic(() => import('./components/JudgesManager'), { ssr: false });
const ReviewsManager = dynamic(() => import('./components/ReviewsManager'), { ssr: false });
const ParticipantsManager = dynamic(() => import('./components/ParticipantsManager'), { ssr: false });
const FinalResultsManager = dynamic(() => import('./components/FinalResultsManager'), { ssr: false });

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('events');
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await fetch('/api/auth', { method: 'DELETE' });
            router.push('/en/admin');
        } catch {
            showToast('Logout failed', 'error');
            setIsLoggingOut(false);
        }
    };

    const tabs = [
        { id: 'events', label: 'Manage Events', icon: <CalendarDays size={18} /> },
        { id: 'results', label: 'Publish Results', icon: <Trophy size={18} /> },
        { id: 'status', label: 'Manage Leaderboard', icon: <Award size={18} /> },
        { id: 'site', label: 'Site Appearance', icon: <LayoutDashboard size={18} /> },
        { id: 'gallery', label: 'Media Gallery', icon: <Upload size={18} /> },
        { id: 'news', label: 'Announcements', icon: <Bell size={18} /> },
        { id: 'participants', label: 'Participant Codes', icon: <Users size={18} /> },
        { id: 'judges', label: 'Judge Management', icon: <Users size={18} /> },
        { id: 'reviews', label: 'Judge Reviews', icon: <MessageSquare size={18} /> },
        { id: 'final-results', label: 'Final Results (Blind)', icon: <Trophy size={18} /> },
        { id: 'messages', label: 'User Messages', icon: <Mail size={18} /> },
        { id: 'teams', label: 'Registered Teams', icon: <Users size={18} /> }
    ];

    return (
        <div className="min-h-screen bg-bg-dark flex flex-col md:flex-row font-sans text-gray-200 overflow-hidden">
            {/* Mobile Top Bar */}
            <div className="md:hidden flex items-center justify-between px-6 py-4 bg-black/60 border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold border border-gold/40">
                        <Settings size={18} />
                    </div>
                    <span className="font-serif font-bold text-lg gold-gradient-text">CMS Console</span>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-gray-400 hover:text-white"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${toast.type === 'success' ? 'bg-green-900/30 border-green-500/50 text-green-300' : 'bg-red-900/30 border-red-500/50 text-red-300'
                        }`}
                >
                    {toast.message}
                </motion.div>
            )}

            {/* Sidebar Navigation */}
            <aside className={`
                fixed md:relative inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] md:bg-black/40 border-r border-white/10 
                flex flex-col pt-8 pb-6 shadow-2xl shrink-0 transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="px-8 mb-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                             <h2 className="font-serif text-xl font-bold gold-gradient-text tracking-wide">CMS Engine</h2>
                             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-4 text-gray-500 hover:text-white">
                                 <CloseIcon size={20} />
                             </button>
                        </div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Sahityotsav Admin</p>
                    </div>
                    <div className="hidden md:flex w-10 h-10 rounded-full bg-gold/10 border border-gold/30 items-center justify-center text-gold">
                        <Settings size={20} />
                    </div>
                </div>

                <nav className="flex-1 flex flex-col gap-2 px-4">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Management</p>

                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                console.log('Changing tab to:', tab.id);
                                setActiveTab(tab.id);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === tab.id
                                ? 'bg-gold/15 text-gold border border-gold/30 shadow-[inset_0_0_15px_rgba(212,175,55,0.1)]'
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}

                    <div className="h-px bg-white/5 my-2 mx-4" />
                    
                    <Link 
                        href="/admin/assign-codes"
                        className="flex items-center gap-4 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-all font-medium text-sm border border-transparent"
                    >
                        <Hash size={18} />
                        Assign Participant Codes
                    </Link>

                    <Link 
                        href="/admin/final-results"
                        className="flex items-center gap-4 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-all font-medium text-sm border border-transparent"
                    >
                        <Trophy size={18} />
                        View Final Results
                    </Link>
                </nav>

                <div className="mt-auto px-4 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10 mb-4 cursor-pointer hover:border-gold/30 hover:bg-white/10 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-maroon to-red-800 flex items-center justify-center text-white font-bold text-xs">
                            AD
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Administrator</p>
                            <p className="text-xs text-green-400 font-medium tracking-wide">● Online</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold text-red-400 bg-red-950/30 hover:bg-red-900/50 hover:text-red-200 border border-red-900/30 transition-colors"
                    >
                        <LogOut size={16} />
                        {isLoggingOut ? 'Ending Session...' : 'Secure Logout'}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-full h-[30vh] bg-gradient-to-b from-maroon/10 to-transparent pointer-events-none" />

                <div className="p-8 md:p-12 max-w-5xl mx-auto relative z-10">
                    <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="flex-1 w-full">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="flex items-center gap-3 mb-2 text-gold">
                                    <div className="p-2.5 bg-gold/10 rounded-xl">
                                        {tabs.find(t => t.id === activeTab)?.icon}
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">
                                        {tabs.find(t => t.id === activeTab)?.label}
                                    </h1>
                                </div>
                                <p className="text-xs md:text-sm text-gray-400 tracking-wide max-w-lg">
                                    Administrator Console: Manage your Sahityotsav event data and settings.
                                </p>
                            </motion.div>
                        </div>
                        <Link
                            href="/"
                            target="_blank"
                            className="w-full md:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold tracking-widest text-gray-300 hover:text-white border border-white/10 hover:border-gold/30 transition-all flex items-center justify-center gap-3 uppercase"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M7 7h10v10" /><path d="M7 17 17 7" />
                            </svg>
                            View Live Site
                        </Link>
                    </header>

                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="glass-card shadow-2xl relative overflow-hidden mb-12"
                    >
                        <div className="p-4 md:p-8">
                            {activeTab === 'events' && <EventsManager showToast={showToast} />}
                            {activeTab === 'results' && <ResultsManager showToast={showToast} />}
                            {activeTab === 'status' && <StatusManager showToast={showToast} />}
                            {activeTab === 'teams' && <TeamsManager showToast={showToast} />}
                            {activeTab === 'site' && <SettingsManager showToast={showToast} />}
                            {activeTab === 'gallery' && <MediaManager showToast={showToast} />}
                            {activeTab === 'news' && <AnnouncementsManager showToast={showToast} />}
                            {activeTab === 'participants' && <ParticipantsManager showToast={showToast} />}
                            {activeTab === 'judges' && <JudgesManager showToast={showToast} />}
                            {activeTab === 'reviews' && <ReviewsManager showToast={showToast} />}
                            {activeTab === 'final-results' && <FinalResultsManager showToast={showToast} />}
                            {activeTab === 'messages' && <MessagesManager showToast={showToast} />}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

