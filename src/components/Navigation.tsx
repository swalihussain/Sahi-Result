"use client";

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useState, useEffect } from 'react';
import * as motion from 'framer-motion/client';
import { Menu, X as CloseIcon, Globe } from 'lucide-react';

export default function Navigation({ logoUrl = "/logo.png" }: { logoUrl?: string }) {
    const t = useTranslations('Navigation');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    const navLinks = [
        { href: '/', label: t('home') },
        { href: '/results', label: t('results') },
        { href: '/events', label: t('events') },
        { href: '/news', label: t('news') },
        { href: '/gallery', label: t('gallery') },
        { href: '/about', label: t('about') },
        { href: '/contact', label: t('contact') },
    ];

    if (pathname.includes('/admin')) return null;

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8 }}
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || isOpen ? 'bg-bg-dark/90 backdrop-blur-lg border-b border-white/10 shadow-lg py-4' : 'bg-transparent py-6'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 md:px-8 flex justify-between items-center">
                <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
                    <img src={logoUrl} alt="Chaparappadavu Sector Sahityotsav" className="h-12 md:h-20 w-auto object-contain py-1" />
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map(link => (
                        <Link key={link.href} href={link.href} className="text-sm font-medium hover:text-gold transition-colors">{link.label}</Link>
                    ))}
                </div>

                <div className="flex md:hidden items-center gap-4">
                    <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
                        {isOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <motion.div
                initial={false}
                animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden bg-bg-dark/95 backdrop-blur-xl border-b border-white/10"
            >
                <div className="flex flex-col p-6 gap-4">
                    {navLinks.map(link => (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            onClick={() => setIsOpen(false)}
                            className={`text-lg font-medium transition-colors ${pathname === link.href ? 'text-gold' : 'text-gray-300 hover:text-white'}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </motion.div>
        </motion.nav>
    );
}
