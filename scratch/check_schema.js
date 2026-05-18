const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = 'postgresql://postgres:swalihbp128@db.wsfvsxmaahdyswfjulfx.supabase.co:5432/postgres?sslmode=require';

async function inspect() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to PG');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'competitions'
        `);
        console.log('Competitions columns:');
        console.log(res.rows);

    } catch (err) {
        console.error('Inspection error:', err);
    } finally {
        await client.end();
    }
}

inspect();
