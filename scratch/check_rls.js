const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = 'postgresql://postgres:swalihbp128@db.wsfvsxmaahdyswfjulfx.supabase.co:5432/postgres?sslmode=require';

async function checkRLS() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to PG');

        // Check if RLS is enabled
        const rlsRes = await client.query(`
            SELECT relname, relrowsecurity 
            FROM pg_class 
            WHERE relname = 'competitions'
        `);
        console.log('RLS Status (relrowsecurity = true means enabled):');
        console.log(rlsRes.rows);

        // Check policies
        const policyRes = await client.query(`
            SELECT * 
            FROM pg_policies 
            WHERE tablename = 'competitions'
        `);
        console.log('Policies:');
        console.log(policyRes.rows);

    } catch (err) {
        console.error('Inspection error:', err);
    } finally {
        await client.end();
    }
}

checkRLS();
