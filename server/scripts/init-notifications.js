import { createNotificationTable } from '../models/Notification.js';
import pool from '../config/database.js';

const run = async () => {
    try {
        await createNotificationTable();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
