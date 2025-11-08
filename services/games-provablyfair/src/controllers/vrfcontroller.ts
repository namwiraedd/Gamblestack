import { HSMProvider } from "../vrf/hsmProvider";
import { publishProofToS3 } from "../utils/publishProof";
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const provider = process.env.CHAINLINK_VRF_ENABLED === 'true' ? new ChainlinkProvider() : new HSMProvider();

export async function requestAndStore(req, res) {
  const { seedHint } = req.body;
  const { requestId } = await provider.requestRandomness(seedHint);
  // respond immediately with requestId
  res.json({ requestId });
  // worker later polls getProof and publishes when available
}
export async function pollAndPersist(requestId) {
  const proof = await provider.getProof(requestId);
  // save to DB and S3
  const s3key = `proofs/${requestId}.json`;
  await publishProofToS3(s3key, proof);
  await pool.query("INSERT INTO game_provable_receipts (game_id, round_id, server_seed_hash, server_seed, client_seed, result, proof, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now())",
    ["demo-game", requestId, crypto.createHash("sha256").update(proof.seed).digest("hex"), proof.seed, null, JSON.stringify({}), JSON.stringify(proof)]);
}
