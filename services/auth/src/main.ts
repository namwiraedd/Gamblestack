import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Pool } from "pg";
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "missing" });
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (id, email, password_hash, created_at) VALUES (gen_random_uuid(), $1, $2, now()) RETURNING id,email`,
    [email, hash]
  );
  res.json(result.rows[0]);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const r = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  if (r.rowCount === 0) return res.status(401).json({ error: "invalid" });
  const user = r.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid" });
  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_PRIVATE_KEY || "dev", { algorithm: "HS256", expiresIn: "15m" });
  res.json({ token });
});

app.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).end();
  const token = auth.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY || "dev");
    res.json({ payload });
  } catch (e) {
    res.status(401).json({ error: "invalid token" });
  }
});

const port = 4001;
app.listen(port, () => console.log(`Auth service on ${port}`));
