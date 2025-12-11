import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
    console.log('Checking connection...');
    try {
        const client = await pool.connect();
        console.log('✅ Connected to DB');
        client.release();
    } catch (e) {
        console.error('❌ Connection failed:', e.message);
        process.exit(1);
    }

    console.log('Running migrations...');
    const migrations = [
        '../../supabase/migrations/20250109_create_connections_table.sql',
        '../../supabase/migrations/20250109_create_investor_profiles_table.sql'
    ];

    for (const migration of migrations) {
        const filePath = path.join(__dirname, migration);
        const sql = fs.readFileSync(filePath, 'utf8');
        try {
            await pool.query(sql);
            console.log(`✅ Executed ${migration}`);
        } catch (err) {
            console.error(`❌ Error executing ${migration}:`, err.message);
        }
    }
}

async function seedData() {
    console.log('Seeding investor profile...');
    // Find dev1_investor to attach profile
    const userRes = await pool.query("SELECT id FROM users WHERE email = 'dev1_investor@test.com'");
    if (userRes.rows.length === 0) {
        console.log('User dev1_investor@test.com not found. Run "npm run seed-test" first.');
        return;
    }
    const userId = userRes.rows[0].id;

    // Insert profile
    const profile = {
        user_id: userId,
        firm_name: 'Tech Ventures 1',
        location: 'San Francisco, CA',
        investor_type: 'VC',
        investment_stage: 'Seed',
        min_investment_size: 100000,
        max_investment_size: 500000,
        industries: ['SaaS', 'AI'],
        experience_years: 10,
        investment_thesis: 'Investing in AI driven SaaS'
    };

    try {
        await pool.query(`
      INSERT INTO investor_profiles (user_id, firm_name, location, investor_type, investment_stage, min_investment_size, max_investment_size, industries, experience_years, investment_thesis)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO UPDATE SET 
        firm_name = EXCLUDED.firm_name,
        location = EXCLUDED.location,
        industries = EXCLUDED.industries
    `, [profile.user_id, profile.firm_name, profile.location, profile.investor_type, profile.investment_stage, profile.min_investment_size, profile.max_investment_size, profile.industries, profile.experience_years, profile.investment_thesis]);
        console.log('✅ Seeded investor profile for dev1_investor');
    } catch (err) {
        console.error('❌ Error seeding profile:', err.message);
    }
}

async function main() {
    await runMigrations();
    await seedData();
    process.exit();
}

main();
