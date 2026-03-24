import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
    try {
        const db = await getDbConnection();
        const settings = await db.all('SELECT key, value FROM settings');
        const units = await db.all('SELECT institution, points FROM unit_points ORDER BY points DESC');
        
        const config = settings.reduce((acc: any, row: any) => ({ ...acc, [row.key]: row.value }), {});
        
        return NextResponse.json({ settings: config, units });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { heading, units } = await request.json();
        const db = await getDbConnection();
        
        if (heading) {
            await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['points_heading', heading]);
        }
        
        if (units && Array.isArray(units)) {
            for (const u of units) {
                await db.run('INSERT OR REPLACE INTO unit_points (institution, points) VALUES (?, ?)', [u.institution, u.points]);
            }
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
