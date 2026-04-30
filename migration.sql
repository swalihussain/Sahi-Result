-- Migration for Judge Management and Judgement Panel

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
    -- Ensure unique judgement per participant per event per judge
    UNIQUE(event_id, participant_name, judge_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_judgements_event ON judgements(event_id);
CREATE INDEX IF NOT EXISTS idx_judgements_judge ON judgements(judge_id);

-- Ensure RLS is handled or disabled for these new tables as per project pattern
-- Assuming RLS is disabled for simplicity if it matches project style, or enabled for security
ALTER TABLE judges DISABLE ROW LEVEL SECURITY;
ALTER TABLE judgements DISABLE ROW LEVEL SECURITY;
