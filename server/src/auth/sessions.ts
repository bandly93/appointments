// src/auth/sessions.ts
import crypto from "node:crypto";
import type { Response } from "express";
import { env } from "../config/env.js";
import {
  createSession as insertSession,
  findSessionByTokenHash,
  deleteSessionById,
  deleteSessionByTokenHash,
} from "./auth.repository.js";

export class InvalidSessionError extends Error {
  constructor() {
    super("INVALID_SESSION");
  }
}

const SESSION_COOKIE = "refresh_token";
const REFRESH_TOKEN_TTL_MS = parseDuration(env.REFRESH_TOKEN_TTL);

function parseDuration(input: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(input);

  if (!match) {
    throw new Error(`Invalid duration: ${input}`);
  }

  const unitMs = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };

  return Number(match[1]) * unitMs[match[2] as keyof typeof unitMs];
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await insertSession({ userId, tokenHash, expiresAt });

  return { token, expiresAt };
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/api/auth",
  });
}

// Must mirror setSessionCookie's httpOnly/secure/sameSite/path exactly, or the
// browser treats it as a different cookie and won't clear the original.
export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
  });
}

// Rotation is delete-then-create, not atomic: two concurrent refreshes using
// the same pre-rotation token will race, and the loser correctly gets
// InvalidSessionError. The client dedupes concurrent refresh calls to a
// single in-flight request specifically to avoid triggering this.
export async function rotateSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const session = await findSessionByTokenHash(tokenHash);

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) await deleteSessionById(session.id);
    throw new InvalidSessionError();
  }

  await deleteSessionById(session.id);
  const next = await createSession(session.userId);

  return { ...next, user: session.user };
}

export async function endSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await deleteSessionByTokenHash(tokenHash);
}

