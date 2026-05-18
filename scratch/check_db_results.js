const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = 'postgresql://postgres:swalihbp128@db.wsfvsxmaahdyswfjulfx.supabase.co:5432/postgres?sslmode=require';

async function inspectAll() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to PG');

        const compRes = await client.query('SELECT id, name, category, serial_number FROM competitions ORDER BY id ASC');
        console.log('--- ALL COMPETITIONS ---');
        console.log(compRes.rows);

        const resultsRes = await client.query('SELECT DISTINCT competition_id FROM results');
        console.log('--- DISTINCT COMPETITION_IDS IN RESULTS ---');
        console.log(resultsRes.rows);

    } catch (err) {
        console.error('Inspection error:', err);
    } finally {
        await client.end();
    }
}

inspectAll();
