"use client";

import { useTranslations } from 'next-intl';
import * as motion from 'framer-motion/client';
import { MapPin, Phone, Mail, Instagram, Facebook, Youtube } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ContactPage() {
    const t = useTranslations('Contact');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        message: ''
    });
    const [pageSettings, setPageSettings] = useState({
        title: 'Reach Out',
        subtitle: 'Have questions? Our team is here to help.',
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15603.964344426544!2d75.38575975!3d12.1127027!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba46cdbeaa2cbbb%3A0xb35a968fd1350a4e!2sChapparapadavu%2C%20Kerala!5e0!3m2!1sen!2sin!4v1709420000000!5m2!1sen!2sin',
        addressTitle: 'Event Location',
        addressText: 'Chapparapadavu, Kannur, Kerala 670581',
        committeeTitle: 'Organizing Committee',
        adminPhone: '+91 7907406034',
        instagram: '#',
        facebook: '#',
        youtube: '#'
    });

    const extractMapUrl = (input: string) => {
        if (input.includes('<iframe')) {
            const match = input.match(/src="([^"]+)"/);
            return match ? match[1] : input;
        }
        return input;
    };

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setPageSettings({
                    title: data.contact_title || t('title'),
                    subtitle: data.contact_subtitle || t('subtitle'),
                    mapUrl: extractMapUrl(data.map_iframe_url || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15603.964344426544!2d75.38575975!3d12.1127027!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba46cdbeaa2cbbb%3A0xb35a968fd1350a4e!2sChapparapadavu%2C%20Kerala!5e0!3m2!1sen!2sin!4v1709420000000!5m2!1sen!2sin'),
                    addressTitle: data.address_title || t('addressTitle'),
                    addressText: data.address_text || t('addressText'),
                    committeeTitle: data.committee_title || t('committeeTitle'),
                    adminPhone: data.admin_whatsapp ? `+91 ${data.admin_whatsapp}` : '+91 7907406034',
                    instagram: data.instagram_url || '#',
                    facebook: data.facebook_url || '#',
                    youtube: data.youtube_url || '#'
                });
            });
    }, [t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setStatus('success');
                setFormData({ name: '', phone: '', email: '', message: '' });
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-24 px-5 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <span className="text-gold text-sm tracking-widest uppercase mb-2 block">Reach Out</span>
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{pageSettings.title}</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">{pageSettings.subtitle}</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">

                {/* Contact Form */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card"
                >
                    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-400 font-medium">{t('name')}</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-400 font-medium">{t('phone')}</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className="bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400 font-medium">{t('email')}</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400 font-medium">{t('message')}</label>
                            <textarea
                                rows={4}
                                required
                                value={formData.message}
                                onChange={e => setFormData({...formData, message: e.target.value})}
                                className="bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors resize-none"
                                placeholder="How can we help you?"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={status === 'submitting'}
                            className="bg-gradient-to-r from-maroon-dark to-maroon text-white font-semibold py-4 rounded-lg hover:shadow-[0_0_20px_rgba(107,15,26,0.6)] border border-maroon transition-all mt-4 disabled:opacity-50"
                        >
                            {status === 'submitting' ? 'Sending...' : t('submit')}
                        </button>

                        {status === 'success' && (
                            <p className="text-green-500 text-center text-sm font-medium">Message sent successfully! We'll get back to you soon.</p>
                        )}
                        {status === 'error' && (
                            <p className="text-red-500 text-center text-sm font-medium">Failed to send message. Please try again.</p>
                        )}
                    </form>
                </motion.div>

                {/* Info & Map */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-8"
                >
                    <div className="glass-card flex-grow overflow-hidden !p-0">
                        {/* Google Maps Embed iframe */}
                        <iframe
                            src={pageSettings.mapUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 0, minHeight: '300px' }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="grayscale contrast-125 opacity-80 mix-blend-luminosity hover:grayscale-0 hover:mix-blend-normal hover:opacity-100 transition-all duration-700"
                        ></iframe>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass p-6 rounded-2xl border border-white/10 flex items-start gap-4">
                            <div className="p-3 bg-gold/10 rounded-full text-gold">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h4 className="font-serif font-bold mb-1">{pageSettings.addressTitle}</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">{pageSettings.addressText}</p>
                            </div>
                        </div>

                        <div className="glass p-6 rounded-2xl border border-white/10 flex items-start gap-4">
                            <div className="p-3 bg-gold/10 rounded-full text-gold">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h4 className="font-serif font-bold mb-1">{pageSettings.committeeTitle}</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">{pageSettings.adminPhone}</p>
                                <div className="flex gap-3 mt-3">
                                    {pageSettings.instagram && (
                                        <a href={pageSettings.instagram.startsWith('http') ? pageSettings.instagram : `https://${pageSettings.instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors">
                                            <Instagram size={18} />
                                        </a>
                                    )}
                                    {pageSettings.facebook && (
                                        <a href={pageSettings.facebook.startsWith('http') ? pageSettings.facebook : `https://${pageSettings.facebook}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors">
                                            <Facebook size={18} />
                                        </a>
                                    )}
                                    {pageSettings.youtube && (
                                        <a href={pageSettings.youtube.startsWith('http') ? pageSettings.youtube : `https://${pageSettings.youtube}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors">
                                            <Youtube size={18} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
