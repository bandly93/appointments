// src/auth/auth.repository.ts
import { prisma } from "../lib/prisma.js";

export function findUserByEmail(
  email: string
) {
  return prisma.user.findUnique({
    where: { email },
    select: { 
      id: true,
      email: true,
      passwordHash: true,
      role: true
    }
  });
}

type CreateSessionData = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export function createSession(
  { userId, tokenHash, expiresAt }: CreateSessionData
) {
  return prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });
}

