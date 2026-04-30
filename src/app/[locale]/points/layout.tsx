import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Navigation' });
    // Assuming 'points' translation exists or fallback
    return {
        title: t('results'), // fallback
        description: 'Check the points leaderboard.',
    };
}

export default function PointsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
