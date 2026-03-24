import { NextResponse } from 'next/server';
import { getDbConnection, initDb } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
    try {
        const db = await getDbConnection();
        const settings = await db.all('SELECT * FROM settings');
        
        // Convert to key-value object
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        
        return NextResponse.json(settingsMap);
    } catch (error) {
        console.error('Settings GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const db = await getDbConnection();
        
        // Data should be an object of key-value pairs
        for (const [key, value] of Object.entries(data)) {
            await db.run(
                'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
                [key, String(value)]
            );
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Settings POST error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
