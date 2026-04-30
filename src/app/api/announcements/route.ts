import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

export const revalidate = 60;

export async function GET() {
    try {
        const { data: announcements, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(announcements || []);
    } catch (error) {
        console.error('Supabase announcements GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const data = await request.json();
        const { title, type, date } = data;
        if (!title || !type || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const { data: inserted, error } = await supabase.from('announcements').insert([data]).select('id').single();
        if (error) throw error;
        return NextResponse.json({ success: true, id: inserted.id });
    } catch (error) {
        console.error('Supabase announcements POST error:', error);
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Supabase announcements DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }
}
