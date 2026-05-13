"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as motion from 'framer-motion/client';
import { Lock, User, Mail } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
            } else {
                router.push('/en/admin/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-dark relative overflow-hidden px-5">
            {/* Background Decor */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-maroon/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <Link href="/" className="flex justify-center mb-8 hover:opacity-80 transition-opacity">
                    <div className="text-center">
                        <h1 className="font-serif text-3xl font-bold gold-gradient-text tracking-wider mb-2">
                            Sahityotsav
                        </h1>
                        <span className="text-gray-400 text-sm tracking-widest uppercase">Admin Portal</span>
                    </div>
                </Link>

                <div className="glass-card !p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-white/5 rounded-full border border-white/10 text-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                            <Lock size={28} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-8 font-serif">Sign In</h2>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                placeholder="Admin Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-gold transition-colors"
                                required
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                placeholder="Enter admin password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-gold transition-colors"
                                required
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50 flex items-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`mt-4 w-full bg-gradient-to-r from-gold-light to-gold text-black font-bold py-3.5 rounded-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all ${loading ? 'opacity-70 cursor-wait' : ''
                                }`}
                        >
                            {loading ? 'Authenticating...' : 'Access Dashboard'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-500 mt-8">
                        Secured Portal • Authorized Personnel Only
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
