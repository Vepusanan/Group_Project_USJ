import axios from 'axios';
import pool from '../config/database.js';

const API_URL = 'http://127.0.0.1:5000/api';

async function verifyFiltersAndSorting() {
  console.log('🔍 Verifying Filters and Sorting...');

  try {
    // 1. Seed Data: Add multiple startup profiles
    console.log('🌱 Seeding multiple startup profiles...');
    
    // Helper to get user ID
    async function getUserId(email) {
      const res = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      return res.rows[0]?.id;
    }

    const dev1Id = await getUserId('dev1_startup@test.com');
    const dev2Id = await getUserId('dev2_startup@test.com'); // Ensuring seed-test ran, usually dev2 exists
    
    // If dev2 doesn't exist, we might skip full multi-user tests or creating it is hard without pw hash.
    // Assuming seed-test script created dev1-dev4.

    if (dev1Id) {
        await pool.query(`
          INSERT INTO startup_profiles (user_id, tagline, industry, location_country, funding_stage)
          VALUES ($1, 'AI Agents', 'Tech', 'USA', 'Seed')
          ON CONFLICT (user_id) 
          DO UPDATE SET industry='Tech', location_country='USA', funding_stage='Seed'
        `, [dev1Id]);
    }
    
    if (dev2Id) {
        await pool.query(`
          INSERT INTO startup_profiles (user_id, tagline, industry, location_country, funding_stage)
          VALUES ($1, 'BioHealth', 'Healthcare', 'UK', 'Series A')
          ON CONFLICT (user_id) 
          DO UPDATE SET industry='Healthcare', location_country='UK', funding_stage='Series A'
        `, [dev2Id]);
    }

    console.log('✅ Profiles seeded/updated.');

    // 2. Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'dev1_investor@test.com',
      password: 'Test123!'
    });
    const token = loginRes.data.token;

    // 3. Test Filter: Industry = Tech
    console.log('\n🧪 Testing Filter: Industry=Tech');
    const techRes = await axios.get(`${API_URL}/startups?industry=Tech`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   Found: ${techRes.data.data.length}`);
    if (techRes.data.data.some(s => s.industry === 'Tech') && !techRes.data.data.some(s => s.industry === 'Healthcare')) {
        console.log('✅ Filter correct.');
    } else {
        console.log('❌ Filter incorrect (check logs).');
    }

    // 4. Test Sort: Alphabetical
    console.log('\n🧪 Testing Sort: Alphabetical');
    const alphaRes = await axios.get(`${API_URL}/startups?sortBy=alphabetical`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const names = alphaRes.data.data.map(s => s.fullName);
    console.log('   Names:', names);
    const sorted = [...names].sort();
    if (JSON.stringify(names) === JSON.stringify(sorted)) {
        console.log('✅ Sorting correct.');
    } else {
        console.log('❌ Sorting incorrect.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    if (error.response) console.error('   Response:', error.response.data);
    process.exit(1);
  }
}

verifyFiltersAndSorting();
