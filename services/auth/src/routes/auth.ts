import express from "express";
import { signAccessToken, genRefreshToken, hashToken } from "../jwt";
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const router = express.Router();

router.post("/login", async (req,res) => {
  // authenticate user omitted...
  const userId = "the-user-uuid";
  const access = await signAccessToken({ sub: userId }, 900); // 15m
  const refresh = genRefreshToken();
  const hashed = hashToken(refresh);
  const expiresAt = new Date(Date.now() + 30*24*60*60*1000); // 30 days
  const r = await pool.query("INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_by_ip) VALUES ($1,$2,$3,$4) RETURNING id", [userId, hashed, expiresAt.toISOString(), req.ip]);
  res.json({ access, refresh });
});

// rotate endpoint
router.post("/token/rotate", async (req,res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).end();
  const hashed = hashToken(refresh);
  const row = await pool.query("SELECT id,user_id,revoked_at,expires_at FROM refresh_tokens WHERE token_hash=$1", [hashed]);
  if (row.rowCount===0) return res.status(401).json({ error: "invalid" });
  const tokenRow = row.rows[0];
  if (tokenRow.revoked_at || new Date(tokenRow.expires_at) < new Date()) return res.status(401).json({ error: "revoked/expired" });

  // rotate: create new refresh, mark this one replaced
  const newRefresh = genRefreshToken();
  const newHash = hashToken(newRefresh);
  const newExpires = new Date(Date.now() + 30*24*60*60*1000);
  const newRow = await pool.query("INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_by_ip) VALUES ($1,$2,$3,$4) RETURNING id", [tokenRow.user_id, newHash, newExpires.toISOString(), req.ip]);
  await pool.query("UPDATE refresh_tokens SET revoked_at=now(), replaced_by=$1 WHERE id=$2", [newRow.rows[0].id, tokenRow.id]);

  const accessToken = await signAccessToken({ sub: tokenRow.user_id }, 900);
  res.json({ access: accessToken, refresh: newRefresh });
});

// revoke
router.post("/revoke", async (req,res) => {
  const { token } = req.body;
  if (!token) return res.status(400).end();
  await pool.query("UPDATE refresh_tokens SET revoked_at=now() WHERE token_hash=$1", [hashToken(token)]);
  res.json({ ok: true });
});

export default router;
