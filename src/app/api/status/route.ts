import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated, getJudgeSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const revalidate = 60;

export async function GET() {
    try {
        const { data: settingsData, error: setErr } = await supabase.from('settings').select('*');
        const { data: unitsData, error: unitErr } = await supabase.from('unit_points').select('*').order('points', { ascending: false });
        
        if (setErr) throw setErr;
        if (unitErr) throw unitErr;

        const config = (settingsData || []).reduce((acc: any, doc: any) => ({ ...acc, [doc.key]: doc.value }), {});
        
        let unitsList = unitsData || [];
        
        if (unitsList.length === 0) {
            const defaultUnits = [
                { institution: "CHAPPARAPADAVU", points: 0 },
                { institution: "ERUVATTY", points: 0 },
                { institution: "MADAMTHATTU", points: 0 },
                { institution: "MANGARA", points: 0 },
                { institution: "MANGARA BN", points: 0 },
                { institution: "PERUMALABAD", points: 0 },
                { institution: "PERUMBADAVU", points: 0 },
                { institution: "PERUVANA EAST", points: 0 },
                { institution: "PERUVANA WEST", points: 0 },
                { institution: "SHANTHIGIRI", points: 0 },
                { institution: "THENNAM", points: 0 }
            ];
            
            // Insert default units
            await supabase.from('unit_points').insert(defaultUnits);
            
            // Re-fetch sorted units
            const { data: newUnits } = await supabase.from('unit_points').select('*').order('points', { ascending: false });
            unitsList = newUnits || defaultUnits;
        }

        return NextResponse.json({ settings: config, units: unitsList });
    } catch (error) {
        console.error('Supabase status GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    // Allow both admins and judges to update points (judges only via judgement lock)
    const isAdmin = await isAdminAuthenticated();
    const isJudge = await getJudgeSession();
    
    if (!isAdmin && !isJudge) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        
        // Handle incremental point updates from Judgement Panel
        if (body.type === 'update_points') {
            const { unitName, addPoints } = body;
            
            // Get current points
            const { data: current, error: getErr } = await supabase
                .from('unit_points')
                .select('points')
                .eq('institution', unitName)
                .single();
            
            if (getErr) throw getErr;

            const { error: updateErr } = await supabase
                .from('unit_points')
                .update({ points: (current.points || 0) + addPoints })
                .eq('institution', unitName);
            
            if (updateErr) throw updateErr;

            revalidatePath('/', 'layout');
            return NextResponse.json({ success: true });
        }

        // Standard Admin Panel full update
        const { heading, units } = body;
        
        if (heading) {
            await supabase.from('settings').upsert({ key: 'points_heading', value: heading });
        }
        
        if (units && Array.isArray(units)) {
            await supabase.from('unit_points').delete().neq('institution', '___DELETE_ALL___');
            
            if (units.length > 0) {
                const validUnits = units.map(u => ({ 
                    institution: u.institution || 'Unnamed Unit', 
                    points: u.points || 0 
                }));
                const { error: insertError } = await supabase.from('unit_points').insert(validUnits);
                if (insertError) throw insertError;
            }
        }
        
        revalidatePath('/', 'layout');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Supabase status PUT error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}

