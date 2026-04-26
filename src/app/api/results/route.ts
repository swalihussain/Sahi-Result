import { NextResponse } from 'next/server';
import { getDbConnection, initDb } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const compId = searchParams.get('competition_id');

        const db = await getDbConnection();
        let query = `
      SELECT r.id, r.position, r.points_awarded, r.participant_names, r.result_pdf_url,
             r.competition_id, r.team_id,
             t.name as team_name, t.institution as institution,
             c.name as competition_name, c.template_image as template_image, c.category as category
      FROM results r
      JOIN teams t ON r.team_id = t.id
      JOIN competitions c ON r.competition_id = c.id
    `;

        const params: any[] = [];
        if (compId) {
            query += ' WHERE r.competition_id = ?';
            params.push(compId);
        }

        query += ' ORDER BY r.position ASC';

        const results = await db.all(query, params);
        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { competition_id, team_id, position, points_awarded, participant_names, result_pdf_url } = await request.json();

        if (!competition_id || !team_id || !position || !points_awarded) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDbConnection();

        // Check if result already exists for this competition and position
        const existingPosition = await db.get(
            'SELECT id FROM results WHERE competition_id = ? AND position = ?',
            [competition_id, position]
        );
        if (existingPosition) {
            return NextResponse.json({ error: 'Result for this position already uploaded' }, { status: 400 });
        }

        // Insert result
        const result = await db.run(
            'INSERT INTO results (competition_id, team_id, position, points_awarded, participant_names, result_pdf_url) VALUES (?, ?, ?, ?, ?, ?)',
            [competition_id, team_id, position, points_awarded, participant_names || null, result_pdf_url || null]
        );

        // The team's total points should not be updated automatically per user request.
        // Points are manually managed by admin.

        return NextResponse.json({ success: true, id: result.lastID });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add result' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const compId = searchParams.get('competition_id');

        if (!compId) {
            return NextResponse.json({ error: 'Missing competition_id' }, { status: 400 });
        }

        const db = await getDbConnection();
        await db.run('DELETE FROM results WHERE competition_id = ?', [compId]);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete results' }, { status: 500 });
    }
}
