// src/users/users.repository.ts
import { prisma } from "../lib/prisma.js";
import type { UserRole } from "../generated/prisma/enums.js";

export function findAllUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

type CreateUserData = {
  email: string;
  passwordHash: string;
  role: UserRole;
};

export function insertUser({ email, passwordHash, role }: CreateUserData) {
  return prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });
}
