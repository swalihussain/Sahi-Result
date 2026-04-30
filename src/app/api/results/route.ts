import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

export const revalidate = 60;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const compId = searchParams.get('competition_id');

        let query = supabase.from('results').select('*, teams(name, institution), competitions(name, template_image, category)').order('position', { ascending: true });
        
        if (compId) {
            query = query.eq('competition_id', compId);
        }

        const { data: snapshot, error } = await query;
        if (error) throw error;

        const results = snapshot.map((doc: any) => ({
            id: doc.id,
            ...doc,
            team_name: doc.teams?.name,
            institution: doc.teams?.institution,
            competition_name: doc.competitions?.name,
            template_image: doc.competitions?.template_image,
            category: doc.competitions?.category
        }));

        return NextResponse.json(results);
    } catch (error) {
        console.error('Supabase results GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const { competition_id, team_id, position, points_awarded } = data;

        if (!competition_id || !team_id || !position || !points_awarded) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: existing, error: existErr } = await supabase.from('results')
            .select('id')
            .eq('competition_id', competition_id)
            .eq('position', position);
            
        if (existing && existing.length > 0) {
            return NextResponse.json({ error: 'Result for this position already uploaded' }, { status: 400 });
        }

        const validData = {
            competition_id,
            team_id,
            position,
            points_awarded,
            participant_names: data.participant_names || null,
            result_pdf_url: data.result_pdf_url || null
        };

        const { data: inserted, error } = await supabase.from('results').insert([validData]).select('id').single();
        if (error) throw error;

        return NextResponse.json({ success: true, id: inserted.id });
    } catch (error) {
        console.error('Supabase results POST error:', error);
        return NextResponse.json({ error: 'Failed to add result' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const compId = searchParams.get('competition_id');

        if (!compId) {
            return NextResponse.json({ error: 'Missing competition_id' }, { status: 400 });
        }

        const { error } = await supabase.from('results').delete().eq('competition_id', compId);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Supabase results DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete results' }, { status: 500 });
    }
}
