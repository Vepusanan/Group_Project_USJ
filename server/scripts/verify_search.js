import axios from 'axios';
import pool from '../config/database.js';

const API_URL = 'http://127.0.0.1:5000/api';

async function verifySearch() {
    console.log('🔍 Verifying Search Functionality...');

    try {
        // 1. Seed Data: Add profile for Developer 1 Startup
        console.log('🌱 Seeding startup profile...');
        const startupEmail = 'dev1_startup@test.com';

        // Get user ID
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [startupEmail]);
        if (userRes.rows.length === 0) {
            throw new Error(`User ${startupEmail} not found. Run "npm run seed-test" first.`);
        }
        const userId = userRes.rows[0].id;

        // Upsert profile
        await pool.query(`
      INSERT INTO startup_profiles (user_id, tagline, description)
      VALUES ($1, 'Revolutionizing AI Agents', 'We build autonomous agents that code.')
      ON CONFLICT (user_id) 
      DO UPDATE SET tagline = EXCLUDED.tagline, description = EXCLUDED.description
    `, [userId]);
        console.log('✅ Profile seeded.');

        // 2. Login as Investor
        console.log('\n🔑 Logging in as Investor...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'dev1_investor@test.com',
            password: 'Test123!'
        });
        const token = loginRes.data.token;
        console.log('✅ Login successful');

        // 3. Test Search (Match Tagline)
        const searchTerm = 'autonomous';
        console.log(`\n🔎 Searching for "${searchTerm}"...`);
        const searchRes = await axios.get(`${API_URL}/startups?search=${searchTerm}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (searchRes.data.success) {
            console.log(`✅ Search successful. Found ${searchRes.data.data.length} results.`);
            const found = searchRes.data.data.find(s => s.email === startupEmail);
            if (found) {
                console.log('✅ Found expected startup:', found.fullName);
                console.log('   Tagline:', found.tagline);
                console.log('   Description:', found.description);
            } else {
                console.error('❌ Expected startup NOT found in results.');
                console.log('Results:', searchRes.data.data);
            }
        } else {
            console.error('❌ Search request failed:', searchRes.data);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        if (error.response) console.error('   Response:', error.response.data);
        process.exit(1);
    }
}

verifySearch();
