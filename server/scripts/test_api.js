import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testApi() {
    console.log('🚀 Starting API Test...\n');

    // 1. Login to get token
    console.log('1️⃣  Logging in as test startup...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'dev1_startup@test.com',
            password: 'Test123!'
        })
    });

    const loginData = await loginRes.json();

    if (!loginData.success) {
        console.error('❌ Login failed:', loginData.error);
        console.log('💡 Note: Make sure the server is running (npm run dev) and you have run setup_db.js');
        return;
    }

    const token = loginData.token;
    console.log('✅ Login successful! Token obtained.\n');

    // Helper to make authenticated GET request
    const getInvestors = async (params = '') => {
        const res = await fetch(`${BASE_URL}/investors${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    };

    try {
        // 2. Test Basic List
        console.log('2️⃣  Testing Basic List (GET /api/investors)...');
        const listData = await getInvestors();
        console.log(`   Status: ${listData.success ? '✅ OK' : '❌ Failed'}`);
        console.log(`   Count: ${listData.count}`);
        if (listData.data && listData.data.length > 0) {
            console.log(`   Sample: ${listData.data[0].firm_name} (${listData.data[0].investor_type})`);
        }
        console.log('');

        // 3. Test Search
        console.log('3️⃣  Testing Search (query: "Ventures")...');
        const searchData = await getInvestors('?search=Ventures');
        console.log(`   Found: ${searchData.count}`);
        searchData.data.forEach(inv => console.log(`   - ${inv.firm_name}`));
        console.log('');

        // 4. Test Filters
        console.log('4️⃣  Testing Filters (location: "San Francisco", industry: "AI")...');
        const filterData = await getInvestors('?location=San Francisco&industries=AI');
        console.log(`   Found: ${filterData.count}`);
        filterData.data.forEach(inv => console.log(`   - ${inv.firm_name} [${inv.location}]`));
        console.log('');

        // 5. Test Sorting
        console.log('5️⃣  Testing Sort (experience DESC)...');
        const sortData = await getInvestors('?sort=experience');
        if (sortData.data && sortData.data.length > 0) {
            console.log(`   Top experienced: ${sortData.data[0].firm_name} (${sortData.data[0].experience_years} years)`);
        }
        console.log('');

    } catch (error) {
        console.error('❌ Request failed:', error.message);
        console.log('💡 Make sure the server is running on port 5000');
    }
}

testApi();
