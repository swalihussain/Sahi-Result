"use client";

import { usePathname } from 'next/navigation';

export default function Footer({ footerText }: { footerText: string }) {
    const pathname = usePathname();
    
    if (pathname.includes('/admin')) return null;

    return (
        <footer className="mt-auto py-8 border-t border-white/10 text-center text-sm text-gray-500">
            {footerText}
        </footer>
    );
}
