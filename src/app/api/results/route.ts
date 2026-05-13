import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated, getJudgeSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const competition_id = searchParams.get('competition_id');

    let query = supabase
        .from('results')
        .select(`
            *,
            competitions (
                name,
                category,
                serial_number
            ),
            units (
                unit_name
            )
        `);
    if (competition_id) {
        query = query.eq('competition_id', competition_id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    try {
        const isAdmin = await isAdminAuthenticated();
        const judge = await getJudgeSession();
        
        if (!judge && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        
        // Safety check: if competition_id or team_id is missing, skip insertion
        if (!body.competition_id || !body.team_id) {
            return NextResponse.json({ success: true, message: 'Skipped invalid entry' });
        }

        // Pick only allowed fields for the results table
        const { 
            competition_id, 
            team_id, 
            position, 
            points_awarded, 
            participant_names, 
            result_pdf_url
        } = body;

        const resultData: any = {
            competition_id,
            team_id,
            position,
            points_awarded,
            participant_names,
            result_pdf_url
        };

        const { data, error } = await supabase
            .from('results')
            .insert([resultData])
            .select();

        if (error) {
            console.error('Result insert error:', error, 'Data:', resultData);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data[0] || { success: true });
    } catch (error: any) {
        console.error('Critical Results API Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Internal Server Error' 
        }, { status: 500 });
    }
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
