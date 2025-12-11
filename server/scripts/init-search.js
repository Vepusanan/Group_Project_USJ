import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initSearch() {
    console.log('🔄 Initializing startup_profiles table...');

    try {
        const migrationPath = path.join(__dirname, '../../supabase/migrations/20251212_create_startup_profiles_table.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Applying migration...');
        await pool.query(sql);

        console.log('✅ Startup profiles table created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating startup profiles table:', error.message);
        process.exit(1);
    }
}

initSearch();
