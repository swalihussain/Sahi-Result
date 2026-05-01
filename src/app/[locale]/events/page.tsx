import { supabase } from '@/lib/supabase';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import EventsList from './EventsList';

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Navigation' });
    return {
        title: t('events'),
        description: 'Explore the full list of cultural and artistic events.',
        openGraph: { title: t('events') }
    };
}

export default async function EventsPage() {
    const t = await getTranslations('Events');
    
    let dynamicSettings: Record<string, string> = {};
    let events: any[] = [];
    
    try {
        const { data: settingsSnap } = await supabase.from('settings').select('*');
        if (settingsSnap) {
            settingsSnap.forEach((doc: any) => {
                dynamicSettings[doc.key] = doc.value;
            });
        }
        
        const { data: eventsSnap } = await supabase.from('events').select('*').order('date', { ascending: true });
        if (eventsSnap) {
            events = eventsSnap;
        }
    } catch (e) {
        console.error("Events fetch failed", e);
    }

    const pageTitle = dynamicSettings.events_title || t('title');
    const pageSubtitle = dynamicSettings.events_subtitle || t('subtitle');

    return (
        <EventsList 
            initialTitle={pageTitle}
            initialSubtitle={pageSubtitle}
            events={events}
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
