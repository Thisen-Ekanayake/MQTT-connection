import fs from 'fs';
import { pool } from './db.js';

async function init() {
    const schema = fs.readFileSync('database/schema.sql', 'utf8');
    await pool.query(schema);
    console.log('Database schema initialized');
    process.exit(0);
}

init().catch(err => {
    console.error('DB init failed:', err);
    process.exit(1);
});