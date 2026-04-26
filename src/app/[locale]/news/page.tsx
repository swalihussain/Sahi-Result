import { getFirestore } from '@/lib/firebase-admin';
import { getTranslations } from 'next-intl/server';
import NewsContent from './NewsContent';

export default async function NewsPage() {
    const t = await getTranslations('News');
    
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
