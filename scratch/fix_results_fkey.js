const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = 'postgresql://postgres:swalihbp128@db.wsfvsxmaahdyswfjulfx.supabase.co:5432/postgres?sslmode=require';

async function migrate() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to PG');

        // Drop existing results to avoid foreign key violations if needed
        await client.query('DELETE FROM results');
        console.log('Results cleared');

        // Drop the old foreign key constraint
        await client.query('ALTER TABLE results DROP CONSTRAINT IF EXISTS results_team_id_fkey');
        console.log('Old constraint dropped');

        // Add the new foreign key constraint pointing to the units table
        await client.query('ALTER TABLE results ADD CONSTRAINT results_unit_id_fkey FOREIGN KEY (team_id) REFERENCES units(id) ON DELETE CASCADE');
        console.log('New constraint added to units table');

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await client.end();
    }
}

migrate();
