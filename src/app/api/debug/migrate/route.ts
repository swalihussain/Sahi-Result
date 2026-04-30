import { NextResponse } from 'next/server';
// @ts-ignore
import { Client } from 'pg';

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
        
        const sql = `
-- Create judges table
CREATE TABLE IF NOT EXISTS judges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('stage', 'non-stage', 'both')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create judgements table
CREATE TABLE IF NOT EXISTS judgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES competitions(id),
    participant_name TEXT NOT NULL,
    unit_name TEXT NOT NULL,
    judge_1_marks FLOAT8,
    judge_2_marks FLOAT8,
    judge_3_marks FLOAT8,
    total_marks FLOAT8 NOT NULL,
    feedback TEXT,
    category TEXT NOT NULL CHECK (category IN ('stage', 'non-stage')),
    judge_id UUID REFERENCES judges(id),
    is_locked BOOLEAN DEFAULT FALSE,
    rank INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, participant_name, judge_id)
);

CREATE INDEX IF NOT EXISTS idx_judgements_event ON judgements(event_id);
CREATE INDEX IF NOT EXISTS idx_judgements_judge ON judgements(judge_id);

ALTER TABLE judges DISABLE ROW LEVEL SECURITY;
ALTER TABLE judgements DISABLE ROW LEVEL SECURITY;
        `;
        
        await client.query(sql);
        
        return NextResponse.json({ success: true, message: 'Migration executed successfully' });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await client.end();
    }
}
