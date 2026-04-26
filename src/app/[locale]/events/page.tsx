import { getFirestore } from '@/lib/firebase-admin';
import { getTranslations } from 'next-intl/server';
import EventsList from './EventsList';

export default async function EventsPage() {
    const t = await getTranslations('Events');
    
    // Fetch dynamic settings and competitions from Firestore
    let dynamicSettings: Record<string, string> = {};
    let competitions: any[] = [];
    
    try {
        const firestore = getFirestore();
        if (firestore) {
            const settingsSnap = await firestore.collection('settings').get();
            settingsSnap.docs.forEach(doc => {
                dynamicSettings[doc.id] = doc.data().value;
            });
            
            const compsSnap = await firestore.collection('competitions')
                .where('results_only', '==', 0)
                .orderBy('date', 'asc')
                .get();
            competitions = compsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    } catch (e) {
        console.error("Events Firestore fetch failed", e);
    }

    const pageTitle = dynamicSettings.events_title || t('title');
    const pageSubtitle = dynamicSettings.events_subtitle || t('subtitle');

    return (
        <EventsList 
            initialTitle={pageTitle}
            initialSubtitle={pageSubtitle}
            events={competitions}
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
