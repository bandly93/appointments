// src/auth/auth.repository.ts
import { prisma } from "../lib/prisma.js";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export function createUser(
  email: string,
  passwordHash: string,
) {
  return prisma.user.create({
    data: {
      email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });
}