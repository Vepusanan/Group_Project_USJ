import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

async function verifyEndpoint() {
    try {
        // 1. Login as Investor
        console.log('🔑 Logging in as Investor...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'dev1_investor@test.com',
            password: 'Test123!'
        });

        if (!loginRes.data.success) {
            throw new Error('Login failed');
        }

        const token = loginRes.data.token;
        console.log('✅ Login successful');

        // 2. Fetch Startups (Page 1)
        console.log('\n📡 Fetching Startups (Page 1)...');
        const startupsRes = await axios.get(`${API_URL}/startups?page=1&limit=5`, {
            headers: { Authorization: `Bearer ${token}` } // Fixed format
        });

        if (startupsRes.data.success) {
            console.log('✅ Fetched startups successfully');
            console.log(`   Count: ${startupsRes.data.data.length}`);
            console.log('   Pagination:', startupsRes.data.pagination);

            if (startupsRes.data.data.length > 0) {
                console.log('   Sample Startup:', startupsRes.data.data[0]);

                // Verify connection status field exists
                if (startupsRes.data.data[0].hasOwnProperty('connectionStatus')) {
                    console.log('✅ Connection status field present');
                } else {
                    console.error('❌ Connection status field MISSING');
                }
            } else {
                console.log('⚠️ No startups found (might need seeding)');
            }
        } else {
            console.error('❌ Failed to fetch startups:', startupsRes.data);
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.response ? error.response.data : error.message);
    }
}

verifyEndpoint();
