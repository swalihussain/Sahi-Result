const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    const connectionString = "postgresql://postgres:swalihbp128@db.wsfvsxmaahdyswfjulfx.supabase.co:5432/postgres?sslmode=require";
    const client = new Client({ 
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sql = fs.readFileSync(path.join(__dirname, '../migration.sql'), 'utf8');
        console.log('Running migration...');
        
        await client.query(sql);
        console.log('Migration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

run();
