import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Navigation' });
    return {
        title: t('gallery'),
        description: 'View photos and videos from the event.',
        openGraph: { title: t('gallery') }
    };
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
    return children;
}
