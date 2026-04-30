import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '../globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const sora = Sora({ 
  subsets: ['latin'], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  style: ['normal'],
  variable: '--font-sora' 
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sahi-result.onrender.com'),
  title: {
    default: 'Chapparapadavu Sahityotsav | Cultural Festival',
    template: '%s | Chapparapadavu Sahityotsav'
  },
  description: 'Official website for the grand Chapparapadavu Sahityotsav. View events, latest news, live results, and cultural highlights.',
  keywords: ['Chapparapadavu', 'Sahityotsav', 'Cultural Festival', 'Arts Fest', 'Kerala', 'Live Results', 'Events', 'SSF'],
  authors: [{ name: 'Chapparapadavu Sahityotsav' }],
  creator: 'Chapparapadavu Sahityotsav',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sahi-result.onrender.com',
    title: 'Chapparapadavu Sahityotsav | Cultural Festival',
    description: 'Official website for the grand Chapparapadavu Sahityotsav. View events, latest news, live results, and cultural highlights.',
    siteName: 'Chapparapadavu Sahityotsav',
    images: [
      {
        url: '/poster.jpg',
        width: 1200,
        height: 630,
        alt: 'Chapparapadavu Sahityotsav Poster',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chapparapadavu Sahityotsav | Cultural Festival',
    description: 'Official website for the grand Chapparapadavu Sahityotsav. View events, latest news, live results, and cultural highlights.',
    images: ['/poster.jpg'],
  },
  icons: {
    icon: '/favicon.ico?v=2',
    apple: '/logo.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const revalidate = 60; // Cache pages for 60 seconds to support 100k+ concurrent users

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  let siteLogo = "/logo.png";
  let footerText = "© 2026 Chapparapadavu Sahityotsav. All rights reserved.";
  try {
      const { data: logoDoc } = await supabase.from('settings').select('value').eq('key', 'site_logo').single();
      if (logoDoc) siteLogo = logoDoc.value || siteLogo;
      
      const { data: footerDoc } = await supabase.from('settings').select('value').eq('key', 'footer_text').single();
      if (footerDoc) footerText = footerDoc.value || footerText;
  } catch (e) {
      console.error("Layout content fetch failed", e);
  }

  return (
    <html lang={locale} className={`${sora.variable}`}>
      <body className={`${sora.className} bg-bg-dark text-white antialiased min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Navigation logoUrl={siteLogo} />
          {children}
          <Footer footerText={footerText} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
