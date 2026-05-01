const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function check() {
    const connectionString = "postgresql://postgres:swalihbp128@db.wsfvsxmaahdyswfjulfx.supabase.co:5432/postgres?sslmode=require";
    const client = new Client({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        console.log('Checking competitions table...');
        const res1 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'competitions'");
        console.log('competitions columns:', res1.rows);

        console.log('Checking judges table...');
        const res2 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'judges'");
        console.log('judges columns:', res2.rows);

        console.log('Checking judgements table...');
        const res3 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'judgements'");
        console.log('judgements columns:', res3.rows);

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await client.end();
    }
}

check();
