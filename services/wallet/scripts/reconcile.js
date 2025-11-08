#!/usr/bin/env node
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async ()=> {
  // naive reconciliation: compute balance per user & compare to cached snapshot or materialized view
  const r = await pool.query(`SELECT user_id, account, SUM(CASE WHEN type='credit' THEN amount ELSE -amount END)::numeric as balance FROM ledger_entries GROUP BY user_id, account`);
  // Emit results to logs and to a reconciliation table
  for (const row of r.rows) {
    console.log(row);
    await pool.query("INSERT INTO reconciliation_runs (user_id, account, balance, run_at) VALUES ($1,$2,$3,now())", [row.user_id, row.account, row.balance]);
  }
  process.exit(0);
})();
