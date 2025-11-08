import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function saveIdempotencyResponse(recordId: string, responseObj: any) {
  await pool.query("UPDATE idempotency_keys SET response=$1, status='completed' WHERE id=$2", [responseObj, recordId]);
}
