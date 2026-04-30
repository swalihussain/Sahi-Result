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
CREATE TABLE IF NOT EXISTS judges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('stage', 'non-stage', 'both')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

ALTER TABLE judges DISABLE ROW LEVEL SECURITY;
ALTER TABLE judgements DISABLE ROW LEVEL SECURITY;

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
