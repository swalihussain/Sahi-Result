import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { name, email, message } = data;

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { error } = await supabase.from('messages').insert([{
            ...data,
            status: 'New'
        }]);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact submit error:', error);
        return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 });
    }
}

export async function GET() {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: messages, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        return NextResponse.json(messages || []);
    } catch (error) {
        console.error('Messages fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, status } = await request.json();
        const { error } = await supabase.from('messages').update({ status }).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message update error:', error);
        return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
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

        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message delete error:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}
