import express from "express";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());

// commit: publish hash of server seed
app.post("/seed/commit", (req, res) => {
  const server_seed = crypto.randomBytes(32).toString("hex");
  const server_seed_hash = crypto.createHash("sha256").update(server_seed).digest("hex");
  // In real setup: store server_seed encrypted; publish server_seed_hash before round
  res.json({ server_seed_hash, server_seed_id: server_seed.slice(0,8) });
});

// reveal: show server seed and proof
app.post("/seed/reveal", (req, res) => {
  const { server_seed, client_seed = "", nonce = 0 } = req.body;
  if (!server_seed) return res.status(400).json({ error: "server_seed required" });
  const result = crypto.createHmac("sha256", server_seed).update(client_seed + ":" + nonce).digest("hex");
  res.json({ result, method: "HMAC-SHA256" });
});

// demo spin of a 3-reel slot (very simplified)
app.post("/spin", (req, res) => {
  const { client_seed = "", nonce = 0, server_seed } = req.body;
  if (!server_seed) return res.status(400).json({ error: "server_seed required" });
  const hash = crypto.createHmac("sha256", server_seed).update(client_seed + ":" + nonce).digest("hex");
  // use hash to produce numbers
  const nums = [0,1,2].map((i) => parseInt(hash.substr(i*8,8),16) % 10);
  const win = nums[0] === nums[1] && nums[1] === nums[2];
  res.json({ reels: nums, win });
});

const port = 4004;
app.listen(port, () => console.log(`Games provably-fair demo on ${port}`));
