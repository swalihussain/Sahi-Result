import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        // In a real app, use environment variables and bcrypt.
        // For this simple template, we use a basic check.
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nexus2026';

        if (password === ADMIN_PASSWORD) {
            // Set a simple auth cookie
            const response = NextResponse.json({ success: true });
            response.cookies.set('admin_auth', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
            return response;
        }

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('admin_auth');
    return response;
}
