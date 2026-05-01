import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import { Client } from 'pg';

export async function GET() {
    console.log('Migration trigger started');
    let connectionString = process.env.DATABASE_URL || "postgresql://postgres:swalihbp128@db.wsfvsxmaahdyswfjulfx.supabase.co:5432/postgres?sslmode=require";
    
    const client = new Client({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('PG connected');
        
        const sql = `
DROP TABLE IF EXISTS judgements;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS participants;

CREATE TABLE IF NOT EXISTS judges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('stage', 'non-stage', 'both')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id INTEGER REFERENCES competitions(id),
    participant_name TEXT NOT NULL,
    unit_name TEXT NOT NULL,
    code_letter TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(competition_id, code_letter)
);

CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id INTEGER REFERENCES competitions(id),
    code_letter TEXT NOT NULL,
    judge1_marks FLOAT8,
    judge2_marks FLOAT8,
    judge3_marks FLOAT8,
    final_marks FLOAT8 NOT NULL,
    rank INT,
    feedback TEXT,
    status TEXT NOT NULL DEFAULT 'locked',
    judge_id UUID REFERENCES judges(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(competition_id, code_letter, judge_id)
);

ALTER TABLE judges DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;

-- Re-insert demo judge
INSERT INTO judges (name, email, password, category, status)
VALUES ('Demo Judge', 'mohdswalihbp128@gmail.com', 'swalihbp', 'both', 'active')
ON CONFLICT (email) DO NOTHING;
        `;
        
        await client.query(sql);
        console.log('SQL executed');
        
        return NextResponse.json({ success: true, message: 'Migration executed successfully' });
    } catch (error: any) {
        console.error('Migration error:', error);
        
        // Fallback: try to insert demo judge via supabase-js anyway
        try {
            const { error: insertErr } = await supabase.from('judges').insert([{
                name: 'Demo Judge',
                email: 'mohdswalihbp128@gmail.com',
                password: 'swalihbp',
                category: 'both',
                status: 'active'
            }]);
            if (!insertErr) return NextResponse.json({ success: true, message: 'SQL failed but Judge inserted via API' });
        } catch (e) {}

        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    } finally {
        await client.end();
    }
}
