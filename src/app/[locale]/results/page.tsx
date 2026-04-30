import { supabase } from '@/lib/supabase';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import ResultsContent from './ResultsContent';

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Navigation' });
    return {
        title: t('results'),
        description: 'View the latest live results and competition standings.',
        openGraph: { title: t('results') }
    };
}

export default async function ResultsPage() {
    const t = await getTranslations('Results');
    
    let dynamicSettings: Record<string, string> = {};
    try {
        const { data } = await supabase.from('settings').select('*');
        if (data) {
            data.forEach((doc: any) => {
                dynamicSettings[doc.key] = doc.value;
            });
        }
    } catch (e) {
        console.error("Results settings fetch failed", e);
    }

    const pageTitle = dynamicSettings.results_title || t('title');
    const pageSubtitle = dynamicSettings.results_subtitle || t('subtitle');
    const tableHeading = dynamicSettings.points_heading || "🏆 Final Status";

    return (
        <ResultsContent 
            initialTitle={pageTitle}
            initialSubtitle={pageSubtitle}
            initialTableHeading={tableHeading}
        />
    );
}
