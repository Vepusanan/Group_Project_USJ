import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initFilters() {
    console.log('🔄 Initializing filter columns...');

    try {
        const migrationPath = path.join(__dirname, '../../supabase/migrations/20251212_add_filter_columns_to_startup_profiles.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Applying migration...');
        await pool.query(sql);

        console.log('✅ Filter columns added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding filter columns:', error.message);
        process.exit(1);
    }
}

initFilters();
