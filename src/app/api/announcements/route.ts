import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
    try {
        const db = await getDbConnection();
        const announcements = await db.all('SELECT * FROM announcements ORDER BY created_at DESC');
        return NextResponse.json(announcements);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, type, stage_number, date } = await request.json();

        if (!title || !type || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDbConnection();
        const result = await db.run(
            'INSERT INTO announcements (title, type, stage_number, date) VALUES (?, ?, ?, ?)',
            [title, type, stage_number || null, date]
        );

        return NextResponse.json({ success: true, id: result.lastID });
    } catch (error) {
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

        const db = await getDbConnection();
        await db.run('DELETE FROM announcements WHERE id = ?', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }
}
