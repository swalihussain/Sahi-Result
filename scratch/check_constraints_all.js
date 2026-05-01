const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = 'postgresql://postgres:swalihbp128@db.wsfvsxmaahdyswfjulfx.supabase.co:5432/postgres?sslmode=require';

async function check() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT conname, pg_get_constraintdef(c.oid), contype
            FROM pg_constraint c 
            JOIN pg_namespace n ON n.oid = c.connamespace 
            WHERE n.nspname = 'public' 
            AND conrelid = 'results'::regclass
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

check();
