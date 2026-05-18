const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = 'postgresql://postgres:swalihbp128@db.wsfvsxmaahdyswfjulfx.supabase.co:5432/postgres?sslmode=require';

async function fix() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to PG');

        // 1. Audit results table policies
        const resultsPolicies = await client.query(`
            SELECT * 
            FROM pg_policies 
            WHERE tablename = 'results'
        `);
        console.log('Results table policies:');
        console.log(resultsPolicies.rows);

        // 2. Add UPDATE policy for competitions table
        console.log('Adding UPDATE policy to competitions table...');
        await client.query(`
            DROP POLICY IF EXISTS "Enable update for authenticated users only" ON competitions;
            CREATE POLICY "Enable update for authenticated users only" 
            ON competitions 
            FOR UPDATE 
            TO authenticated 
            USING (true) 
            WITH CHECK (true);
        `);
        console.log('UPDATE policy added');

        // 3. Add DELETE policy for competitions table
        console.log('Adding DELETE policy to competitions table...');
        await client.query(`
            DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON competitions;
            CREATE POLICY "Enable delete for authenticated users only" 
            ON competitions 
            FOR DELETE 
            TO authenticated 
            USING (true);
        `);
        console.log('DELETE policy added');

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await client.end();
    }
}

fix();
