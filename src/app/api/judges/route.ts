import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { data, error } = await supabase
            .from('judges')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Judges GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch judges' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await request.json();
        const { data, error } = await supabase
            .from('judges')
            .insert([body])
            .select()
            .single();
        
        if (error) throw error;
        revalidatePath('/', 'layout');
        return NextResponse.json(data);
    } catch (error) {
        console.error('Judges POST error:', error);
        return NextResponse.json({ error: 'Failed to add judge' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await request.json();
        const { id, ...updates } = body;
        const { data, error } = await supabase
            .from('judges')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        revalidatePath('/', 'layout');
        return NextResponse.json(data);
    } catch (error) {
        console.error('Judges PUT error:', error);
        return NextResponse.json({ error: 'Failed to update judge' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { error } = await supabase
            .from('judges')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        revalidatePath('/', 'layout');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Judges DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete judge' }, { status: 500 });
    }
}
