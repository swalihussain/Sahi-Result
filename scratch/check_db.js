const { Client } = require('pg');

async function check() {
    const connectionString = "postgresql://postgres:swalihbp128@db.wsfvsxmaahdyswfjulfx.supabase.co:5432/postgres?sslmode=require";
    const client = new Client({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT count(*) FROM judges");
        console.log('Judges count:', res.rows[0].count);
        
        const res2 = await client.query("SELECT name, email FROM judges");
        console.log('Judges list:', res2.rows);
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await client.end();
    }
}

check();
