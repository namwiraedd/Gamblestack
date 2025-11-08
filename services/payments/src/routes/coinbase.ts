import express from "express";
import crypto from "crypto";
import { idempotencyHandler } from "../middleware/idempotency";
const router = express.Router();

router.post("/coinbase", express.json(), idempotencyHandler, async (req, res) => {
  const sig = req.headers["x-cc-webhook-signature"] as string;
  const computed = crypto.createHmac("sha256", process.env.COINBASE_SHARED_SECRET!).update(JSON.stringify(req.body)).digest("hex");
  if (sig !== computed) return res.status(400).end();
  // process
  res.json({ok:true});
});
export default router;
