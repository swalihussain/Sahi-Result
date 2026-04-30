import { supabase } from '@/lib/supabase';
import { getTranslations } from 'next-intl/server';
import MatchesList from './MatchesList';

export default async function MatchesPage() {
    const t = await getTranslations('Navigation');
    
    let dynamicSettings: Record<string, string> = {};
    let competitions: any[] = [];
    
    try {
        const { data: settingsSnap } = await supabase.from('settings').select('*');
        if (settingsSnap) {
            settingsSnap.forEach((doc: any) => {
                dynamicSettings[doc.key] = doc.value;
            });
        }
        
        const { data: compsSnap } = await supabase.from('competitions').select('*').order('date', { ascending: true });
        if (compsSnap) {
            competitions = compsSnap;
        }
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
