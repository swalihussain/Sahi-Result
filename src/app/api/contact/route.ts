import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { name, phone, email, message } = await request.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDbConnection();
        await db.run(
            'INSERT INTO messages (name, phone, email, message) VALUES (?, ?, ?, ?)',
            [name, phone, email, message]
        );

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
        const db = await getDbConnection();
        const messages = await db.all('SELECT * FROM messages ORDER BY created_at DESC');
        return NextResponse.json(messages);
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
        const db = await getDbConnection();
        await db.run('UPDATE messages SET status = ? WHERE id = ?', [status, id]);
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
        const db = await getDbConnection();
        await db.run('DELETE FROM messages WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message delete error:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}
