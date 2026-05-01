import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Specify the path to the sqlite file
const dbPath = path.join(process.cwd(), 'database.sqlite');

let dbInstance: Database | null = null;
let isInitialized = false;

/**
 * Open a connection to the SQLite database
 */
export async function getDbConnection() {
  try {
    if (dbInstance && isInitialized) return dbInstance;

    if (!dbInstance) {
      dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });
    }

    if (!isInitialized) {
      await initDb();
      isInitialized = true;
    }

    return dbInstance;
  } catch (error) {
    console.error("Database connection error:", error);
    // If it's a read-only filesystem error (common on Vercel), log it specifically
    if (String(error).includes('READONLY')) {
      console.warn("Detected Read-Only filesystem. SQLite changes will not persist. Use a remote DB like Turso for Vercel.");
    }
    throw error;
  }
}

/**
 * Initialize the database tables
 */
export async function initDb() {
  const db = await getDbConnection();

  // Create competitions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      competition_type TEXT,
      template_image TEXT,
      description TEXT,
      results_only INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrations for competitions
  const compColumns = [
    { name: 'competition_type', type: 'TEXT' },
    { name: 'template_image', type: 'TEXT' },
    { name: 'description', type: 'TEXT' },
    { name: 'results_only', type: 'INTEGER DEFAULT 0' }
  ];
  
  for (const col of compColumns) {
    try {
      await db.exec(`ALTER TABLE competitions ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {
      // Column already exists
    }
  }

  // Create other tables
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

    CREATE TABLE IF NOT EXISTS unit_points (
      institution TEXT PRIMARY KEY,
      points INTEGER DEFAULT 0
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

  // Ensure unit_points has data from teams if empty
  const unitCount = await db.get('SELECT COUNT(*) as count FROM unit_points');
  if (unitCount.count === 0) {
    await db.exec(`
      INSERT OR IGNORE INTO unit_points (institution, points)
      SELECT institution, SUM(total_points) as points FROM teams GROUP BY institution
    `);
  }

  console.log('Database initialized successfully.');
}

// Function to reset the DB for testing (development only)
export async function dropTables() {
  const db = await getDbConnection();
  await db.exec(`
    DROP TABLE IF EXISTS unit_points;
    DROP TABLE IF EXISTS announcements;
    DROP TABLE IF EXISTS results;
    DROP TABLE IF EXISTS competitions;
    DROP TABLE IF EXISTS teams;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS settings;
  `);
  isInitialized = false;
}
