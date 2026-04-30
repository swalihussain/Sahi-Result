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
  title: 'Chapparapadavu Sahityotsav | Cultural Festival',
  description: 'Official website for the grand Chapparapadavu Sahityotsav. View events, latest news, live results, and cultural highlights.',
  icons: {
    icon: '/favicon.ico?v=2',
  }
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
