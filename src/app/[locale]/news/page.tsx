import { supabase } from '@/lib/supabase';
import { getTranslations } from 'next-intl/server';
import NewsContent from './NewsContent';

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
