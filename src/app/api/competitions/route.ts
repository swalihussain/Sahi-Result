import { NextResponse } from 'next/server';
import { getDbConnection, initDb } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

// Ensure DB is initialized before first API call
export async function GET() {
    try {
        const db = await getDbConnection();
        const competitions = await db.all('SELECT * FROM competitions ORDER BY created_at DESC');
        return NextResponse.json(competitions);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, date, category, competition_type, template_image, serial_number, match_number, results_only } = await request.json();

        if (!name || !date || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDbConnection();
        const result = await db.run(
            'INSERT INTO competitions (name, date, category, competition_type, template_image, serial_number, match_number, results_only) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, date, category, competition_type || null, template_image || null, serial_number || null, match_number || null, results_only || 0]
        );

        return NextResponse.json({ success: true, id: result.lastID });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
    }
}
