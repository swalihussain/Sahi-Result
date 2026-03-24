import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { headers } from 'next/headers';
import '../globals.css';
import Navigation from '@/components/Navigation';
import { getDbConnection } from '@/lib/db';

const sora = Sora({ 
  subsets: ['latin'], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  style: ['normal'],
  variable: '--font-sora' 
});

export const metadata: Metadata = {
  title: 'Chapparapadavu Sahityotsav | Cultural Festival',
  description: 'Official website for the grand Chapparapadavu Sahityotsav. View events, latest news, live results, and cultural highlights.',
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
  const isAdmin = pathname.includes('/admin');

  // Fetch dynamic settings
  let siteLogo = "/logo.png";
  let footerText = "© 2026 Chapparapadavu Sahityotsav. All rights reserved.";
  try {
      const db = await getDbConnection();
      const logoSetting = await db.get('SELECT value FROM settings WHERE key = "site_logo"');
      if (logoSetting) siteLogo = logoSetting.value;
      
      const footerSetting = await db.get('SELECT value FROM settings WHERE key = "footer_text"');
      if (footerSetting) footerText = footerSetting.value;
  } catch (e) {
      console.error("Layout content fetch failed", e);
  }

  return (
    <html lang={locale} className={`${sora.variable}`}>
      <body className={`${sora.className} bg-bg-dark text-white antialiased min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {!isAdmin && <Navigation logoUrl={siteLogo} />}
          {children}
          {/* Base Footer (Hidden for admin dashboard) */}
          {!isAdmin && (
            <footer className="mt-auto py-8 border-t border-white/10 text-center text-sm text-gray-500">
              {footerText}
            </footer>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

