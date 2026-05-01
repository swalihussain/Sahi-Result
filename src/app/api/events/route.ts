import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data: events, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(events || []);
    } catch (error) {
        console.error('Supabase events GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const data = await request.json();
        const { title, date, description } = data;
        if (!title || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const { data: inserted, error } = await supabase.from('events').insert([{
            title,
            date,
            description
        }]).select('id').single();
        if (error) throw error;
        revalidatePath('/', 'layout');
        return NextResponse.json({ success: true, id: inserted.id });
    } catch (error) {
        console.error('Supabase events POST error:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
