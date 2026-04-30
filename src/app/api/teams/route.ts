import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const revalidate = 60;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const grouped = searchParams.get('grouped');
        
        if (grouped === 'true') {
            const { data: units, error } = await supabase.from('unit_points').select('*').order('points', { ascending: false });
            if (error) throw error;
            const mappedUnits = units.map((u: any) => ({ id: u.institution, name: u.institution, ...u, total_points: u.points }));
            return NextResponse.json(mappedUnits);
        }

        const { data: teams, error } = await supabase.from('teams').select('*').order('total_points', { ascending: false });
        if (error) throw error;
        return NextResponse.json(teams || []);
    } catch (error) {
        console.error('Supabase teams GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const data = await request.json();
        const { name, institution } = data;
        if (!name || !institution) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const { data: inserted, error } = await supabase.from('teams').insert([{
            ...data,
            total_points: 0,
            wins: 0
        }]).select('id').single();
        if (error) throw error;
        revalidatePath('/', 'layout');
        return NextResponse.json({ success: true, id: inserted.id });
    } catch (error) {
        console.error('Supabase teams POST error:', error);
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }
}
