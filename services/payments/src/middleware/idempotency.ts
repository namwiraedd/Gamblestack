import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function idempotencyHandler(req: Request, res: Response, next: NextFunction) {
  // provider-specific idempotency key (Stripe: idempotency-key header; Coinbase: signature id)
  const idKey = req.headers["idempotency-key"] || req.headers["stripe-idempotency-key"] || req.query.idempotency_key;
  const provider = req.baseUrl.split("/")[1] || "unknown";

  if (!idKey) return next(); // no key: continue but try not to double-process

  try {
    const tx = await pool.query(
      `INSERT INTO idempotency_keys (provider, key, status, created_at) VALUES ($1, $2, 'processing', now()) ON CONFLICT (provider, key) DO NOTHING RETURNING id, response, status`,
      [provider, idKey]
    );

    if (tx.rowCount === 0) {
      // existing key: fetch record
      const r = await pool.query("SELECT response, status FROM idempotency_keys WHERE provider=$1 AND key=$2", [provider, idKey]);
      const rec = r.rows[0];
      if (rec.status === 'completed') {
        // replay saved response
        return res.json(rec.response);
      } else {
        // still processing - respond 202 or block until done? Return 202 to provider.
        return res.status(202).json({ status: "processing" });
      }
    }

    // attach idKey to req for handler to save response
    (req as any).__idempotency_key = { provider, key: idKey, record_id: tx.rows[0].id };
    return next();
  } catch (e) {
    console.error("idempotency middleware error", e);
    return next();
  }
}
