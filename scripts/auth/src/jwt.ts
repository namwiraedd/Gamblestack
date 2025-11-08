import { readFileSync } from "fs";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

const privateKey = readFileSync(process.env.JWT_PRIVATE_KEY_PATH || "./secrets/jwt_private.pem");
const publicKey = readFileSync(process.env.JWT_PUBLIC_KEY_PATH || "./secrets/jwt_public.pem");

export async function signAccessToken(payload: any, expiresInSec = 900) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSec}s`)
    .sign(privateKey);
}

export async function verifyToken(token: string) {
  return await jwtVerify(token, publicKey);
}

// refresh token generation and hashing
export function genRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}
export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
