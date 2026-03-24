import { getDbConnection } from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import ResultsContent from './';

export default async function ResultsPage() {
    const t = await getTranslations('Results');
    
    // Fetch dynamic settings
    let dynamicSettings: Record<string, string> = {};
    try {
        const db = await getDbConnection();
        const settingsRows = await db.all('SELECT * FROM settings');
        settingsRows.forEach(row => {
            dynamicSettings[row.key] = row.value;
        });
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
