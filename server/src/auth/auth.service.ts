// src/auth/auth.service.ts
import { z } from "zod";
import { verifyPassword } from "./password.js";
import { findUserByEmail } from "./auth.repository.js";
import { signAccessToken } from "./jwt.js";
import { createSession, rotateSession, endSession, InvalidSessionError } from "./sessions.js";

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

type LoginInput = z.infer<typeof loginSchema>;

export async function loginUser(rawInput: unknown) {
  const parsed = loginSchema.safeParse(rawInput);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  const input: LoginInput = parsed.data;
  const email = input.email.toLowerCase();

  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordIsValid = await verifyPassword(user.passwordHash, input.password);

  if (!passwordIsValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const { token: refreshToken, expiresAt } = await createSession(user.id);

  return {
    accessToken,
    refreshToken,
    expiresAt,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

export async function refreshSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new InvalidSessionError();
  }

  const { token, expiresAt, user } = await rotateSession(refreshToken);
  const accessToken = signAccessToken({ sub: user.id, role: user.role });

  return {
    accessToken,
    refreshToken: token,
    expiresAt,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

export async function logoutUser(refreshToken: string | undefined) {
  if (refreshToken) {
    await endSession(refreshToken);
  }
}
