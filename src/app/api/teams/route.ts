import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const grouped = searchParams.get('grouped');
        const db = await getDbConnection();
        
        if (grouped === 'true') {
            const units = await db.all(`
                SELECT 
                    institution as name, 
                    institution, 
                    points as total_points, 
                    0 as wins
                FROM unit_points 
                ORDER BY total_points DESC
            `);
            const mapped = units.map((u, i) => ({ ...u, id: 'unit-' + i }));
            return NextResponse.json(mapped);
        }

        // Return teams sorted by descending points
        const teams = await db.all('SELECT * FROM teams ORDER BY total_points DESC, wins DESC');
        return NextResponse.json(teams);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, institution, category } = await request.json();

        if (!name || !institution) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDbConnection();

        // Check if team already exists
        const existing = await db.get('SELECT id FROM teams WHERE name = ?', [name]);
        if (existing) {
            return NextResponse.json({ error: 'Team name already exists' }, { status: 400 });
        }

        const result = await db.run(
            'INSERT INTO teams (name, institution, category) VALUES (?, ?, ?)',
            [name, institution, category || 'General']
        );

        return NextResponse.json({ success: true, id: result.lastID });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }
}
