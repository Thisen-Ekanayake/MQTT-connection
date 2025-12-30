import fs from 'fs';
import { pool } from './db.js';

async function runSQL(client, sql, options = {}) {
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    try {
      if (options.noTransaction) {
        // execute statement directly
        await client.query(stmt);
      } else {
        // execute inside transaction
        await client.query('BEGIN');
        await client.query(stmt);
        await client.query('COMMIT');
      }
    } catch (err) {
      if (!options.ignoreErrors) throw err;
      console.warn('Warning (ignored):', err.message);
    }
  }
}

async function init() {
  console.log('Starting DB initialization...');

  // Step 1: Tables, indexes, hypertables (transaction-safe)
  const schemaCore = fs.readFileSync('database/schema-core.sql', 'utf8');
  const client = await pool.connect();
  try {
    console.log('Applying core schema (tables/indexes)...');
    await runSQL(client, schemaCore, { noTransaction: false });
  } finally {
    client.release();
  }

  // Step 2: Continuous aggregates / materialized views (cannot be in transaction)
  const schemaCagg = fs.readFileSync('database/schema-cagg.sql', 'utf8');
  const client2 = await pool.connect();
  try {
    console.log('Applying continuous aggregates (materialized views)...');
    await runSQL(client2, schemaCagg, { noTransaction: true });
  } finally {
    client2.release();
  }

  console.log('Database schema initialized successfully ✅');
  process.exit(0);
}

init().catch(err => {
  console.error('DB init failed ❌:', err);
  process.exit(1);
});