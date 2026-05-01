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

        await client.query('CREATE TABLE IF NOT EXISTS units (id SERIAL PRIMARY KEY, unit_name TEXT NOT NULL UNIQUE)');
        console.log('Table units created');

        const units = [
            'CHAPPARAPADAVU', 'ERUVATTY', 'MADAMTHATTU', 'MANGARA', 'MANGARA BN',
            'PERUMALABAD', 'PERUMBADAVU', 'PERUVANA EAST', 'PERUVANA WEST',
            'SHANTHIGIRI', 'THENNAM'
        ];

        for (const unit of units) {
            await client.query('INSERT INTO units (unit_name) VALUES ($1) ON CONFLICT (unit_name) DO NOTHING', [unit]);
        }
        console.log('Units populated');

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await client.end();
    }
}

migrate();
