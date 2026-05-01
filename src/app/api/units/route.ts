import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: units, error } = await supabase.from('units').select('*').order('unit_name', { ascending: true });
        if (error) throw error;
        return NextResponse.json(units || []);
    } catch (error) {
        console.error('Supabase units GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
    }
}
