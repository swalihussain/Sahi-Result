import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Navigation' });
    return {
        title: t('about'),
        description: 'Learn more about Chapparapadavu Sahityotsav.',
        openGraph: { title: t('about') }
    };
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return children;
}
