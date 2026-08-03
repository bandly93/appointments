// src/users/users.service.ts
import { z } from "zod";
import { hashPassword } from "../auth/password.js";
import { findUserByEmail, deleteSessionsByUserId } from "../auth/auth.repository.js";
import { findAllUsers, insertUser, findUserById, updateUserPassword } from "./users.repository.js";

const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(["STAFF", "PROVIDER", "ADMIN"]).default("STAFF"),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

export function listUsers() {
  return findAllUsers();
}

export async function createUser(rawInput: unknown) {
  const parsed = createUserSchema.safeParse(rawInput);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  const input: CreateUserInput = parsed.data;
  const email = input.email.toLowerCase();

  const existing = await findUserByEmail(email);

  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(input.password);

  return insertUser({ email, passwordHash, role: input.role });
}

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

export async function resetUserPassword(id: string, rawInput: unknown) {
  const existing = await findUserById(id);
  if (!existing) throw new Error("NOT_FOUND");

  const parsed = resetPasswordSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await updateUserPassword(id, passwordHash);

  // A new password should also kick out any session issued under the old
  // one — otherwise a still-logged-in device (or whoever had it before)
  // keeps working right through the reset.
  await deleteSessionsByUserId(id);

  return user;
}
