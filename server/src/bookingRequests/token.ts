// src/bookingRequests/token.ts
import crypto from "node:crypto";

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateAccessToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  return { rawToken, tokenHash: hashToken(rawToken) };
}

export function verifyToken(rawToken: string, tokenHash: string): boolean {
  const candidate = Buffer.from(hashToken(rawToken), "hex");
  const stored = Buffer.from(tokenHash, "hex");
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
}

export function generateVerificationCode(): { rawCode: string; codeHash: string } {
  const rawCode = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  return { rawCode, codeHash: hashToken(rawCode) };
}
