import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Specify the path to the sqlite file
const dbPath = path.join(process.cwd(), 'database.sqlite');

let dbInstance: Database | null = null;

/**
 * Open a connection to the SQLite database
 */
export async function getDbConnection() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  return dbInstance;
}

/**
 * Initialize the database tables
 */
export async function initDb() {
  const db = await getDbConnection();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      serial_number TEXT,
      match_number TEXT,
      competition_type TEXT,
      template_image TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrations for existing DBs
  const columns = ['serial_number', 'match_number', 'competition_type', 'template_image', 'description'];
  for (const col of columns) {
    try {
      await db.exec(`ALTER TABLE competitions ADD COLUMN ${col} TEXT`);
    } catch (e) {
      // Column already exists or other harmless error
    }
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      institution TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      total_points INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      position INTEGER NOT NULL, -- 1 for 1st, 2 for 2nd, 3 for 3rd
      points_awarded INTEGER NOT NULL,
      participant_names TEXT, -- Optional, for individual members
      result_pdf_url TEXT, -- Optional, attached PDF file
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      stage_number TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'unread', -- 'unread', 'read', 'replied'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('points_heading', '🏆 Final Status');
  `);

  console.log('Database initialized successfully.');
}

// Function to reset the DB for testing (development only)
export async function dropTables() {
  const db = await getDbConnection();
  await db.exec(`
    DROP TABLE IF EXISTS announcements;
    DROP TABLE IF EXISTS results;
    DROP TABLE IF EXISTS competitions;
    DROP TABLE IF EXISTS teams;
  `);
}
