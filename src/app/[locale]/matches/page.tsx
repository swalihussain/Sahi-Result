import { getFirestore } from '@/lib/firebase-admin';
import { getTranslations } from 'next-intl/server';
import MatchesList from './MatchesList';

export default async function MatchesPage() {
    const t = await getTranslations('Navigation');
    
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
                .orderBy('date', 'asc')
                .get();
            competitions = compsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    } catch (e) {
        console.error("Matches Firestore fetch failed", e);
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
