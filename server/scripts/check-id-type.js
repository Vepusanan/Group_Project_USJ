import pool from '../config/database.js';

async function checkUserType() {
    try {
        const res = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id'");
        console.log("User ID Type:", res.rows[0]?.data_type);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUserType();
