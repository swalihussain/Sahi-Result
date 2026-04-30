import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Navigation' });
    return {
        title: t('contact'),
        description: 'Get in touch with the organizing committee.',
        openGraph: { title: t('contact') }
    };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return children;
}
