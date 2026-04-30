import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        const { data: judge, error } = await supabase
            .from('judges')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .eq('status', 'active')
            .single();

        if (error || !judge) {
            return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
        }

        const cookieStore = await cookies();
        cookieStore.set('judge_auth', JSON.stringify({
            id: judge.id,
            name: judge.name,
            email: judge.email,
            category: judge.category
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return NextResponse.json({ success: true, judge: { name: judge.name, category: judge.category } });
    } catch (error) {
        console.error('Judge Login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}

export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete('judge_auth');
    return NextResponse.json({ success: true });
}

export async function GET() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('judge_auth');
    if (!authCookie) return NextResponse.json({ authenticated: false });
    return NextResponse.json({ authenticated: true, judge: JSON.parse(authCookie.value) });
}
