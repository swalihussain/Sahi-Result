import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated, getJudgeSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');
    const eventId = searchParams.get('eventId');
    const judgeId = searchParams.get('judgeId');

    try {
        let query = supabase
            .from('judgements')
            .select(`
                *,
                judges (name),
                competitions (name)
            `);
        
        if (all !== 'true') {
            if (eventId) query = query.eq('event_id', eventId);
            if (judgeId) query = query.eq('judge_id', judgeId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Judgements GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch judgements' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const judge = await getJudgeSession();
    if (!judge && !await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { data, error } = await supabase
            .from('judgements')
            .upsert(body, { 
                onConflict: 'event_id,participant_name,judge_id' 
            })
            .select()
            .single();
        
        if (error) throw error;

        // If results are locked/finalized, we might want to update unit points
        // This part would ideally be triggered when the judge "Locks" the result
        
        revalidatePath('/', 'layout');
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Judgements POST error:', error);
        return NextResponse.json({ error: error.message || 'Failed to save judgement' }, { status: 500 });
    }
}
