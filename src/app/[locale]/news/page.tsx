import { supabase } from '@/lib/supabase';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import NewsContent from './NewsContent';

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Navigation' });
    return {
        title: t('news'),
        description: 'Read the latest news and announcements.',
        openGraph: { title: t('news') }
    };
}

export default async function NewsPage() {
    const t = await getTranslations('News');
    
    let dynamicSettings: Record<string, string> = {};
    try {
        const { data } = await supabase.from('settings').select('*');
        if (data) {
            data.forEach((doc: any) => {
                dynamicSettings[doc.key] = doc.value;
            });
        }
    } catch (e) {
        console.error("News settings fetch failed", e);
    }

    const pageTitle = dynamicSettings.news_title || t('title');
    const pageSubtitle = dynamicSettings.news_subtitle || t('subtitle');

    return (
        <NewsContent 
            initialTitle={pageTitle}
            initialSubtitle={pageSubtitle}
        />
    );
}
