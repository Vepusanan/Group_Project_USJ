import pool from "../config/database.js";

const verify = async () => {
    try {
        console.log("🧪 Starting Connection Verification...");

        // 1. Get two test users (Assuming they exist from create-test-users.js)
        const users = await pool.query("SELECT id, email FROM users LIMIT 2");
        if (users.rows.length < 2) {
            console.error("❌ Not enough users to test. Run create-test-users.js first.");
            process.exit(1);
        }
        const user1 = users.rows[0];
        const user2 = users.rows[1];
        console.log(`👤 Testing with User 1: ${user1.email} (ID: ${user1.id})`);
        console.log(`👤 Testing with User 2: ${user2.email} (ID: ${user2.id})`);

        // Clean up previous connections
        await pool.query("DELETE FROM connections WHERE (requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1)", [user1.id, user2.id]);
        await pool.query("DELETE FROM notifications WHERE user_id = $1 OR user_id = $2", [user1.id, user2.id]);

        // 2. Test Request Connection
        console.log("\n--- Test 1: Request Connection ---");
        // We will call the controller logic directly? No, easier to simulate via DB or fetch if server running.
        // Since I'm in a script and might not want to depend on server running:
        // I will replicate the logic call conceptually or use fetch if I start server.
        // Actually, best to test the ENDPOINT.
        // But I don't want to manage background server process in this script unless I have to.
        // I'll test by calling the controller functions directly? No, they take req, res.
        // I'll just simulate the DB inserts for "Request" manually if I want to test "Accept/Decline" logic?
        // No, I want to test the full flow.

        // Let's assume server is running on 5000? I haven't started it yet in this session.
        // I will start the server in background, then run this script?
        // Too complex for single turn.
        // I will just mock `req` and `res` and call the controller functions!
        // Import controller functions.

        // Dynamic import to avoid static import issues if file path wrong
        const controller = await import("../controllers/connectionController.js");

        const mockRes = () => {
            const res = {};
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => { res.data = data; return res; };
            return res;
        };

        // REQUEST
        let req = { body: { requesterId: user1.id, recipientId: user2.id } };
        let res = mockRes();
        await controller.requestConnection(req, res);

        if (res.statusCode === 201) {
            console.log("✅ Request sent successfully.");
        } else {
            console.error("❌ Request failed:", res.data);
        }

        // Verify notification
        const notifCheck = await pool.query("SELECT * FROM notifications WHERE user_id = $1 AND type = 'connection_request'", [user2.id]);
        if (notifCheck.rows.length > 0) {
            console.log("✅ Notification created for recipient.");
        } else {
            console.error("❌ Notification NOT created.");
        }

        // 3. Test Decline Connection
        console.log("\n--- Test 2: Decline Connection ---");
        // Get connection ID
        const connCheck = await pool.query("SELECT id FROM connections WHERE requester_id = $1 AND recipient_id = $2", [user1.id, user2.id]);
        const connId = connCheck.rows[0].id;

        req = { params: { id: connId } };
        res = mockRes();
        await controller.declineConnection(req, res);

        if (res.statusCode === 200 || !res.statusCode) { // res.json sets status 200 default usually but here we mocked request returns
            console.log("✅ Connection declined.");
        } else {
            console.error("❌ Decline failed:", res.data);
        }

        // 4. Test Cooldown
        console.log("\n--- Test 3: Cooldown Logic ---");
        req = { body: { requesterId: user1.id, recipientId: user2.id } };
        res = mockRes();
        await controller.requestConnection(req, res);

        if (res.statusCode === 403) {
            console.log("✅ Cooldown active. Request blocked.");
            console.log("   Message:", res.data.error);
        } else {
            console.error("❌ Cooldown FAILED. Status:", res.statusCode, res.data);
        }

        // 5. Test Accept Connection
        // Reset and try accept
        console.log("\n--- Test 4: Accept Connection ---");
        // Force delete again
        await pool.query("DELETE FROM connections WHERE id = $1", [connId]);
        // Request again (bypass controller checks by inserting directly or just force update timestamp to allow request?)
        // Let's just create a fresh pending connection manually to test ACCEPT logic.
        const newConn = await pool.query(
            "INSERT INTO connections (requester_id, recipient_id, status) VALUES ($1, $2, 'pending') RETURNING id",
            [user1.id, user2.id]
        );
        const newConnId = newConn.rows[0].id;

        req = { params: { id: newConnId } };
        res = mockRes();
        await controller.acceptConnection(req, res);

        if (res.statusCode === 200 || !res.statusCode) {
            console.log("✅ Connection accepted.");
        } else {
            console.error("❌ Accept failed:", res.data);
        }

        // Verify notification for requester
        const acceptNotif = await pool.query("SELECT * FROM notifications WHERE user_id = $1 AND type = 'connection_accepted'", [user1.id]);
        if (acceptNotif.rows.length > 0) {
            console.log("✅ Notification created for requester.");
        } else {
            console.error("❌ Notification NOT created for requester.");
        }

        console.log("\n🎉 Verification Completed!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Verification fatal error:");
        console.error("  Message:", error.message);
        console.error("  Code:", error.code);
        console.error("  Detail:", error.detail);
        console.error("  Hint:", error.hint);
        if (error.routine) console.error("  Routine:", error.routine);
        process.exit(1);
    }
};

verify();
