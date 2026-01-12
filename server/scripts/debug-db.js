import pool from "../config/database.js";

async function debug() {
    try {
        const table = "connections";
        const res = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
            [table]
        );
        console.log(`Columns in ${table}:`);
        res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

        const table2 = "notifications";
        const res2 = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
            [table2]
        );
        console.log(`Columns in ${table2}:`);
        res2.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

debug();
