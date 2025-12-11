import axios from 'axios';
import pool from '../config/database.js';

const API_URL = 'http://127.0.0.1:5000/api';

async function verifyConnections() {
    console.log('🤝 Verifying Connection Management...');

    try {
        // 1. Setup: Ensure we have an Investor and a Startup
        console.log('🌱 Setting up users...');
        const startupEmail = 'dev1_startup@test.com';
        const investorEmail = 'dev1_investor@test.com';

        // Get User IDs
        const getUserId = async (email) => (await pool.query('SELECT id FROM users WHERE email = $1', [email])).rows[0].id;
        const startupId = await getUserId(startupEmail);
        const investorId = await getUserId(investorEmail);

        // Clear existing connections between them
        await pool.query('DELETE FROM connections WHERE investor_id = $1 AND startup_id = $2', [investorId, startupId]);

        // 2. Login as Investor
        console.log('🔑 Logging in as Investor...');
        const investorLogin = await axios.post(`${API_URL}/auth/login`, {
            email: investorEmail,
            password: 'Test123!'
        });
        const investorToken = investorLogin.data.token;

        // 3. Login as Startup
        console.log('🔑 Logging in as Startup...');
        const startupLogin = await axios.post(`${API_URL}/auth/login`, {
            email: startupEmail,
            password: 'Test123!'
        });
        const startupToken = startupLogin.data.token;

        // 4. Investor sends request
        console.log('\n📨 Investor sending connection request...');
        const requestRes = await axios.post(`${API_URL}/connections/request`,
            { startupId },
            { headers: { Authorization: `Bearer ${investorToken}` } }
        );
        const connectionId = requestRes.data.data.id;
        console.log('✅ Request sent. Connection ID:', connectionId);

        // 5. Startup checks pending requests
        console.log('\n📥 Startup checking requests...');
        const startupConnectionsRes = await axios.get(`${API_URL}/connections`, {
            headers: { Authorization: `Bearer ${startupToken}` }
        });
        const pendingReq = startupConnectionsRes.data.data.find(c => c.connection_id === connectionId);
        if (pendingReq && pendingReq.status === 'pending') {
            console.log('✅ Startup received pending request.');
        } else {
            throw new Error('Startup did not see pending request.');
        }

        // 6. Startup accepts request
        console.log('\n✅ Startup accepting request...');
        await axios.put(`${API_URL}/connections/status`,
            { connectionId, status: 'connected' },
            { headers: { Authorization: `Bearer ${startupToken}` } }
        );
        console.log('✅ Request accepted.');

        // 7. Verify status for both
        console.log('\n🔍 Verifying final status...');
        const invConnectionsRes = await axios.get(`${API_URL}/connections`, {
            headers: { Authorization: `Bearer ${investorToken}` }
        });
        const connectedReq = invConnectionsRes.data.data.find(c => c.connection_id === connectionId);

        if (connectedReq && connectedReq.status === 'connected') {
            console.log('✅ Investor sees "connected" status.');
        } else {
            throw new Error('Investor does not see "connected" status.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        if (error.response) console.error('   Response:', error.response.data);
        process.exit(1);
    }
}

verifyConnections();
