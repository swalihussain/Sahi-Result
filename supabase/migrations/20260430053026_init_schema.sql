CREATE TABLE IF NOT EXISTS competitions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  serial_number TEXT,
  match_number TEXT,
  competition_type TEXT,
  template_image TEXT,
  description TEXT,
  results_only INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  institution TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  total_points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS unit_points (
  institution TEXT PRIMARY KEY,
  points INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  points_awarded INTEGER NOT NULL,
  participant_names TEXT,
  result_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  stage_number TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO settings (key, value) VALUES ('points_heading', '🏆 Final Status') ON CONFLICT DO NOTHING;

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'uploads' );
CREATE POLICY "Anon Insert" ON storage.objects FOR INSERT TO anon WITH CHECK ( bucket_id = 'uploads' );
CREATE POLICY "Anon Update" ON storage.objects FOR UPDATE TO anon WITH CHECK ( bucket_id = 'uploads' );
CREATE POLICY "Anon Delete" ON storage.objects FOR DELETE TO anon USING ( bucket_id = 'uploads' );
