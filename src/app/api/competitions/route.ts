import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

export const revalidate = 60;

export async function GET() {
    try {
        const { data: competitions, error } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(competitions || []);
    } catch (error) {
        console.error('Supabase competitions GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const data = await request.json();
        const { name, date, category } = data;
        if (!name || !date || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const { data: inserted, error } = await supabase.from('competitions').insert([{
            ...data,
            results_only: data.results_only ? 1 : 0
        }]).select('id').single();
        if (error) throw error;
        return NextResponse.json({ success: true, id: inserted.id });
    } catch (error) {
        console.error('Supabase competitions POST error:', error);
        return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
    }
}
