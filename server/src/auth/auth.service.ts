// src/auth/auth.service.ts
import { hashPassword } from "./password.js";
import {
  createUser,
  findUserByEmail,
} from "./auth.repository.js";

type RegisterInput = {
  email: string;
  password: string;
};

export async function registerUser(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_IN_USE");
  }

  const passwordHash = await hashPassword(input.password);

  return createUser(email, passwordHash);
}