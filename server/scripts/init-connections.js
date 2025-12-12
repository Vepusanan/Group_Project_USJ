import { createConnectionTable } from '../models/Connection.js';
import pool from '../config/database.js';

const run = async () => {
    try {
        await createConnectionTable();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
