import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = express();
app.use(express.json());

// basic endpoint to create ledger entry (idempotent via tx_id)
app.post("/ledger", async (req, res) => {
  const { user_id, tx_id, account, amount, currency, type, metadata } = req.body;
  if (!user_id || !tx_id || !account || !amount) return res.status(400).json({ error: "missing" });
  // idempotency: ensure tx_id not used
  const existing = await pool.query("SELECT 1 FROM ledger_entries WHERE tx_id=$1", [tx_id]);
  if (existing.rowCount > 0) return res.json({ ok: true, idempotent: true });
  const r = await pool.query(
    `INSERT INTO ledger_entries (user_id, tx_id, account, amount, currency, type, metadata, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now()) RETURNING id`,
    [user_id, tx_id, account, amount, currency || 'USD', type || 'debit', metadata || {}]
  );
  res.json({ id: r.rows[0].id });
});

app.get("/balance/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  const r = await pool.query("SELECT account, SUM(CASE WHEN type='credit' THEN amount ELSE -amount END) as balance FROM ledger_entries WHERE user_id=$1 GROUP BY account", [user_id]);
  res.json(r.rows);
});

const port = 4002;
app.listen(port, () => console.log(`Wallet service on ${port}`));
