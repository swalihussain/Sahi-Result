import { getDbConnection } from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import NewsContent from './';

export default async function NewsPage() {
    const t = await getTranslations('News');
    
    // Fetch dynamic settings
    let dynamicSettings: Record<string, string> = {};
    try {
        const db = await getDbConnection();
        const settingsRows = await db.all('SELECT * FROM settings');
        settingsRows.forEach(row => {
            dynamicSettings[row.key] = row.value;
        });
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
