import { supabase } from '@/lib/supabase';
import { getTranslations } from 'next-intl/server';
import EventsList from './EventsList';

export default async function EventsPage() {
    const t = await getTranslations('Events');
    
    let dynamicSettings: Record<string, string> = {};
    let competitions: any[] = [];
    
    try {
        const { data: settingsSnap } = await supabase.from('settings').select('*');
        if (settingsSnap) {
            settingsSnap.forEach((doc: any) => {
                dynamicSettings[doc.key] = doc.value;
            });
        }
        
        const { data: compsSnap } = await supabase.from('competitions').select('*').eq('results_only', 0).order('date', { ascending: true });
        if (compsSnap) {
            competitions = compsSnap;
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
