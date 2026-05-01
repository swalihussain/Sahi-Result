import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated, getJudgeSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const competition_id = searchParams.get('competition_id');

    let query = supabase.from('results').select('*');
    if (competition_id) {
        query = query.eq('competition_id', competition_id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const judge = await getJudgeSession();
    const isAdmin = await isAdminAuthenticated();
    if (!judge && !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Safety check: if team_id/code_letter is missing, skip insertion
    if (!body.competition_id || (!body.team_id && !body.code_letter)) {
        return NextResponse.json({ success: true, message: 'Skipped invalid entry' });
    }

    // If it's a published result (from Admin), it might not have code_letter or judge_id
    if (isAdmin && !body.code_letter) {
        const { data, error } = await supabase
            .from('results')
            .insert([body])
            .select();
        if (error) {
            console.error('Published result insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json(data[0] || { success: true });
    }

    // Standard judging result
    const { data, error } = await supabase
        .from('results')
        .upsert(body, { onConflict: 'competition_id,code_letter,judge_id' })
        .select();

    if (error) {
        console.error('Judging result upsert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data[0] || { success: true });
}

export async function DELETE(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const competition_id = searchParams.get('competition_id');
    if (!competition_id) {
        return NextResponse.json({ error: 'competition_id is required' }, { status: 400 });
    }

    const { error } = await supabase.from('results').delete().eq('competition_id', competition_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
