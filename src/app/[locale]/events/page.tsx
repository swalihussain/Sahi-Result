import { getDbConnection } from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import EventsList from './EventsList';

export default async function EventsPage() {
    const t = await getTranslations('Events');
    
    // Fetch dynamic settings
    let dynamicSettings: Record<string, string> = {};
    let competitions: any[] = [];
    
    try {
        const db = await getDbConnection();
        const settingsRows = await db.all('SELECT * FROM settings');
        settingsRows.forEach(row => {
            dynamicSettings[row.key] = row.value;
        });
        
        competitions = await db.all('SELECT * FROM competitions WHERE results_only = 0 ORDER BY date ASC');
    } catch (e) {
        console.error("Events fetch failed", e);
    }

    const pageTitle = dynamicSettings.events_title || t('title');
    const pageSubtitle = dynamicSettings.events_subtitle || t('subtitle');

    return (
        <EventsList 
            initialTitle={pageTitle}
            initialSubtitle={pageSubtitle}
            events={competitions.filter(c => !c.results_only)}
            translations={{
                filterAll: t('filterAll'),
                filterLiterary: t('filterLiterary'),
                filterCultural: t('filterCultural'),
                filterSports: t('filterSports'),
                viewDetails: t('viewDetails')
            }}
        />
    );
}
