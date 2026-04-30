import { NextResponse } from 'next/server';
// @ts-ignore
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        return NextResponse.json({ error: 'DATABASE_URL not found' }, { status: 500 });
    }

    const client = new Client({ 
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        // Read migration.sql
        const sqlPath = path.join(process.cwd(), 'migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await client.query(sql);
        
        return NextResponse.json({ success: true, message: 'Migration executed successfully' });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await client.end();
    }
}
