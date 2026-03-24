import { getDbConnection } from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import MatchesList from './MatchesList';

export default async function MatchesPage() {
    const t = await getTranslations('Navigation'); // Or the new page identifier if added
    
    // Fetch dynamic settings
    let dynamicSettings: Record<string, string> = {};
    let competitions: any[] = [];
    
    try {
        const db = await getDbConnection();
        const settingsRows = await db.all('SELECT * FROM settings');
        settingsRows.forEach(row => {
            dynamicSettings[row.key] = row.value;
        });
        
        competitions = await db.all('SELECT * FROM competitions ORDER BY date ASC');
    } catch (e) {
        console.error("Matches fetch failed", e);
    }

    const pageTitle = dynamicSettings.matches_title || "Festival Schedule";
    const pageSubtitle = dynamicSettings.matches_subtitle || "Stay updated with the complete lineup of competitions and sessions.";

    return (
        <MatchesList 
            initialTitle={pageTitle}
            initialSubtitle={pageSubtitle}
            competitions={competitions}
        />
    );
}
