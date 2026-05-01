"use client";

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Trophy, ArrowRightLeft, Share2, X } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';

export default function ResultDetailsPage() {
    const t = useTranslations('Results');
    const { id } = useParams();
    const router = useRouter();
    const printRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [templateId, setTemplateId] = useState(0);
    const [bgTemplateIdx, setBgTemplateIdx] = useState(0);
    const [templates, setTemplates] = useState<string[]>([]);

    const [competition, setCompetition] = useState<any>(null);
    const [winners, setWinners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [settings, setSettings] = useState<any>(null);
    const [containerScale, setContainerScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);


    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Result: ${competition?.name}`,
                text: `View the official result for ${competition?.name}`,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    const nextTemplate = () => {
        // Haptic feedback for mobile
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }

        // If we have custom templates, only cycle through those images
        // No color theme cycling as per user request to only show uploaded templates
        if (templates.length > 1) {
            setBgTemplateIdx((prev) => (prev + 1) % templates.length);
            // Lock color theme to 0 (black text) as requested by user
            setTemplateId(0);
        } else if (templates.length === 1) {
            // Already showing the one image, keep black text
            setTemplateId(0);
        } else {
            // No custom templates uploaded, cycle through the color themes
            setTemplateId((prev) => (prev + 1) % 5);
        }
    };


    useEffect(() => {
        const handleResize = () => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Allow for header and control buttons gap
            const topOffset = viewportWidth >= 768 ? 200 : 150;
            const horizontalPadding = viewportWidth >= 768 ? 40 : 20;
            const containerPadding = viewportWidth >= 768 ? 60 : 32;

            const availableWidth = Math.min(viewportWidth - (horizontalPadding * 2), 1080);
            const contentWidth = availableWidth - containerPadding;

            const widthScale = contentWidth / 1080;
            const heightScale = (viewportHeight - (topOffset + horizontalPadding)) / 1350;

            setContainerScale(Math.min(widthScale, heightScale, 1));
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchWithTimeout = async (resource: string, options: any = {}) => {
            const { timeout = 8000 } = options;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(resource, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        };

        const fetchData = async () => {
            try {
                // Fetch competitions first to find current competition info
                const compRes = await fetchWithTimeout("/api/competitions");
                if (!compRes.ok) throw new Error("Competitions fetch failed");
                const compData = await compRes.json();

                if (Array.isArray(compData)) {
                    const currentComp = compData.find((c: any) => c.id.toString() === id);
                    if (currentComp) setCompetition(currentComp);
                }

                // Fetch results for this competition
                const resRes = await fetchWithTimeout(`/api/results?competition_id=${id}`);
                if (!resRes.ok) throw new Error("Results fetch failed");
                const resData = await resRes.json();
                if (Array.isArray(resData)) {
                    setWinners(resData);

                    // Parse templates from result_pdf_url
                    const rawPdfUrl = resData.find((w: any) => w.result_pdf_url)?.result_pdf_url;
                    if (rawPdfUrl) {
                        try {
                            const parsed = JSON.parse(rawPdfUrl);
                            const templateList = Array.isArray(parsed) ? parsed : [rawPdfUrl];
                            setTemplates(templateList);
                            if (templateList.length > 0) {
                                setTemplateId(0); // Default to black text theme for custom backgrounds
                            }
                        } catch (e) {
                            setTemplates([rawPdfUrl]);
                            setTemplateId(0);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        fetchWithTimeout('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(err => console.error("Failed to fetch settings", err));
    }, [id]);

    const handleDownloadHQ = async () => {
        if (!printRef.current || !competition) return;
        setDownloading(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(printRef.current, {
                scale: 3, // Increased scale for even higher quality
                useCORS: true,
                backgroundColor: styles.bg,
                width: 1080,
                height: 1350,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                logging: false,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.querySelector('[data-poster-container]') as HTMLElement;
                    if (el) {
                        el.style.transform = 'none';
                        el.style.width = '1080px';
                        el.style.height = '1350px';
                        el.style.position = 'relative';
                        el.style.margin = '0';
                        el.style.padding = '0';
                    }
                }
            });

            canvas.toBlob((blob) => {
                if (!blob) throw new Error("Canvas to Blob failed");
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `result-${competition.name.replace(/\s+/g, '-').toLowerCase()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }, 'image/png');
        } catch (err) {
            console.error(err);
            alert("Download failed. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="min-h-screen pt-40 text-center text-white font-serif">Loading results...</div>;
    if (!competition) return <div className="min-h-screen pt-40 text-center text-white font-serif">Result not found for this event.</div>;

    const winnersSorted = [...winners].sort((a, b) => a.position - b.position);
    const officialPdfUrl = winnersSorted.find(w => w.result_pdf_url)?.result_pdf_url;

    const styles = (() => {
        switch (templateId) {
            case 1: return { bg: '#1a1a1a', text: '#ffffff', sub: '#9ca3af', meta: 'rgba(255,255,255,0.4)', accent: '#FFC510', card: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };
            case 2: return { bg: '#1e3a8a', text: '#ffffff', sub: '#bfdbfe', meta: 'rgba(255,255,255,0.6)', accent: '#fbbf24', card: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)' };
            case 3: return { bg: '#064e3b', text: '#ffffff', sub: '#a7f3d0', meta: 'rgba(255,255,255,0.6)', accent: '#6ee7b7', card: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)' };
            case 4: return { bg: '#831843', text: '#ffffff', sub: '#fbcfe8', meta: 'rgba(255,255,255,0.6)', accent: '#fbcfe8', card: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)' };
            default: return { bg: '#FFC510', text: '#000000', sub: 'rgba(0,0,0,0.8)', meta: 'rgba(0,0,0,0.4)', accent: '#FF2D55', card: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.1)' };
        }
    })();

    return (
        <div className="min-h-screen pt-32 pb-24 px-5 max-w-5xl mx-auto">
            <div className="flex flex-col items-center mb-10 w-full px-2">
                <div className="flex items-center gap-2.5 md:gap-4 flex-wrap justify-center">
                    {/* Template Design */}
                    {/* Template Design */}
                    <button
                        onClick={nextTemplate}
                        className="bg-white text-black w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] group z-20"
                        title="Change Design Template"
                    >
                        <ArrowRightLeft
                            size={28}
                            className={`group-active:rotate-180 transition-transform duration-500 ${templateId % 2 === 0 ? 'rotate-0' : 'rotate-180'}`}
                        />
                    </button>

                    {/* Download */}
                    <button
                        onClick={handleDownloadHQ}
                        disabled={downloading}
                        className="bg-[#22C55E] text-white w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                        title="Download Poster"
                    >
                        <Download size={20} className="md:size-[28px]" />
                    </button>

                    {/* Share */}
                    <button
                        onClick={handleShare}
                        className="bg-[#3B82F6] text-white w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                        title="Share Result"
                    >
                        <Share2 size={20} className="md:size-[28px]" />
                    </button>

                    {/* Cancel */}
                    <Link
                        href="/results"
                        className="bg-[#EF4444] text-white w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                        title="Cancel"
                    >
                        <X size={20} className="md:size-[28px]" />
                    </Link>
                </div>
            </div>

            {/* Scale Sensor */}
            <div ref={containerRef} className="w-full h-0 invisible pointer-events-none" />

            {/* Decorative Container */}
            <div className="w-full flex flex-col items-center overflow-hidden bg-black/20 rounded-3xl p-3 md:p-10 border border-white/5">
                {/* Visual Wrapper: This div defines the visual space for the scaled poster */}
                <div
                    style={{
                        width: `${1080 * containerScale}px`,
                        height: `${1350 * containerScale}px`,
                        position: 'relative',
                        flexShrink: 0
                    }}
                >
                    <motion.div
                        data-poster-container
                        initial={false}
                        animate={{ scale: containerScale, opacity: 1, backgroundColor: styles.bg }}
                        transition={{ duration: 0.3 }}
                        style={{
                            width: '1080px',
                            height: '1350px',
                            transformOrigin: 'top left',
                            position: 'absolute',
                            left: 0,
                            top: 0
                        }}
                        className="overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)]"
                        ref={printRef}
                    >
                        {/* Background Layer */}
                        {(() => {
                            const isImage = (url: string) => {
                                if (!url) return false;
                                const cleanUrl = url.split('?')[0].toLowerCase();
                                return /\.(jpg|jpeg|png|webp|gif|svg)$/.test(cleanUrl) || url.includes('image');
                            };

                            // Use currently selected template from uploaded ones, or fallback to competition template
                            const bgUrl = templates.length > 0
                                ? templates[bgTemplateIdx]
                                : competition.template_image;

                            return bgUrl && isImage(bgUrl) && (
                                <div className="absolute inset-0" style={{ backgroundColor: styles.bg }}>
                                    <img
                                        src={bgUrl}
                                        alt="Result Background"
                                        className="w-full h-full object-cover" // Switched back to cover to prevent stretching/bars
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                </div>
                            );
                        })()}

                        <div className="relative z-10 w-full h-full p-[80px] flex flex-col items-start font-sans">
                            {/* Header Section */}
                            <div className="w-full pl-[60px] pr-[140px] mb-[60px] h-[180px] flex-shrink-0">
                                {settings?.poster_header && (
                                    <img
                                        src={settings.poster_header}
                                        alt="Poster Header"
                                        className="w-full h-full object-contain object-left"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                )}
                            </div>

                            {/* Metadata Header - Category, Type, and Result Number */}
                            <div
                                id="header-v3"
                                className={`w-full grid grid-cols-[1fr_auto] items-center pl-[60px] pr-[140px] pb-[60px] border-b-2 mt-[20px]`}
                                style={{ borderColor: styles.border }}
                            >
                                <div className="flex flex-col gap-4 max-w-[70%]">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span
                                            className="font-medium text-[32px] uppercase tracking-[0.2em] opacity-90"
                                            style={{ color: styles.text }}
                                        >
                                            {competition.category || ""}
                                        </span>
                                    </div>
                                    <h1
                                        className="font-normal text-[72px] leading-[1] uppercase tracking-tighter drop-shadow-sm"
                                        style={{ color: styles.text }}
                                    >
                                        {competition.name}
                                    </h1>
                                </div>

                                <div className="flex flex-col items-end">
                                    <div
                                        className="p-5 rounded-2xl flex flex-col items-center min-w-[140px]"
                                        style={{ backgroundColor: styles.card }}
                                    >
                                        <span
                                            className="font-black text-[14px] uppercase tracking-[4px] leading-none mb-3"
                                            style={{ color: styles.meta }}
                                        >
                                            Result ID
                                        </span>
                                        <span
                                            className="font-black text-[86px] leading-none tracking-tighter"
                                            style={{ color: styles.text }}
                                        >
                                            {id}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Winners Section */}
                            <div className="mt-[60px] flex flex-col gap-[75px] w-full pl-[60px] pr-[140px]">
                                {winnersSorted.map((winner) => (
                                    <div key={winner.id} className="flex items-start gap-[40px]">
                                        <div className="mt-4 flex flex-col gap-4 items-center w-10">
                                            {[...Array(winner.position)].map((_, i) => (
                                                <svg key={i} width="24" height="24" viewBox="0 0 24 24" className="drop-shadow-sm">
                                                    <path
                                                        d="M12 2L2 12l10 10 10-10z"
                                                        fill={
                                                            winner.position === 1 ? '#2563eb' :
                                                                winner.position === 2 ? '#3b82f6' :
                                                                    winner.position === 3 ? '#60a5fa' : '#93c5fd'
                                                        }
                                                    />
                                                </svg>
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-8">
                                            {(winner.participant_names || winner.team_name || "").split(/,|\n/).filter(Boolean).map((name: string, nIdx: number) => (
                                                <div key={nIdx} className="flex flex-col">
                                                    <h3
                                                        className="font-bold text-[52px] uppercase leading-none tracking-tight mb-2"
                                                        style={{ color: styles.text }}
                                                    >
                                                        {name.trim()}
                                                    </h3>
                                                    <p
                                                        className="font-light text-[34px] leading-tight italic opacity-90 uppercase"
                                                        style={{ color: styles.sub }}
                                                    >
                                                        {winner.units?.unit_name || winner.institution || ""}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {winnersSorted.length === 0 && (
                                    <div
                                        className="font-serif italic py-20 text-[48px]"
                                        style={{ color: styles.meta }}
                                    >
                                        Waiting for official announcement...
                                    </div>
                                )}
                            </div>

                            {/* Branding Footer */}
                            {/* Branding Footer explicitly hidden */}
                            <div
                                id="footer-hidden"
                                className="mt-auto w-full h-[120px] opacity-0 pointer-events-none"
                            />


                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
