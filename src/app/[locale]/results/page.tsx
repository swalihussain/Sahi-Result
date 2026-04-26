import { getFirestore } from '@/lib/firebase-admin';
import { getTranslations } from 'next-intl/server';
import ResultsContent from './ResultsContent';

export default async function ResultsPage() {
    const t = await getTranslations('Results');
    
    // Fetch dynamic settings from Firestore
    let dynamicSettings: Record<string, string> = {};
    try {
        const firestore = getFirestore();
        if (firestore) {
            const snapshot = await firestore.collection('settings').get();
            snapshot.docs.forEach(doc => {
                dynamicSettings[doc.id] = doc.data().value;
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
