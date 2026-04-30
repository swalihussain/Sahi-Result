import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
    try {
        const { data: settingsData, error: setErr } = await supabase.from('settings').select('*');
        const { data: unitsData, error: unitErr } = await supabase.from('unit_points').select('*').order('points', { ascending: false });
        
        if (setErr) throw setErr;
        if (unitErr) throw unitErr;

        const config = (settingsData || []).reduce((acc: any, doc: any) => ({ ...acc, [doc.key]: doc.value }), {});
        
        return NextResponse.json({ settings: config, units: unitsData || [] });
    } catch (error) {
        console.error('Supabase status GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { heading, units } = await request.json();
        
        if (heading) {
            await supabase.from('settings').upsert({ key: 'points_heading', value: heading });
        }
        
        if (units && Array.isArray(units)) {
            for (const u of units) {
                await supabase.from('unit_points').upsert({ institution: u.institution, points: u.points });
            }
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Supabase status PUT error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
