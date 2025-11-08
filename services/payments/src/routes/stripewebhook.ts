import express from "express";
import { idempotencyHandler } from "../middleware/idempotency";
import { saveIdempotencyResponse } from "../utils/saveIdempotencyResponse";
const router = express.Router();

router.post("/stripe", idempotencyHandler, async (req, res) => {
  const idKeyObj = (req as any).__idempotency_key;
  // verify signature using stripe SDK (omitted here)
  // process the webhook: update ledger, create entries, send events to broker
  const result = { ok: true, processed_at: new Date().toISOString() };

  // persist response if idempotency used
  if (idKeyObj) {
    await saveIdempotencyResponse(idKeyObj.record_id, result);
  }
  return res.json(result);
});

export default router;
