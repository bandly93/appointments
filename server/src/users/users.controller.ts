import { Request, Response } from "express";
import { listUsers, createUser, resetUserPassword } from "./users.service.js";

export async function getUsers(req: Request, res: Response) {
  const users = await listUsers();
  res.json({ success: true, users });
}

export async function postUser(req: Request, res: Response) {
  try {
    const user = await createUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter a valid email and a password of at least 8 characters" });
    }
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      return res.status(409).json({ error: "Email is already in use" });
    }
    throw err;
  }
}

export async function postResetPassword(req: Request, res: Response) {
  try {
    const user = await resetUserPassword(String(req.params.id), req.body);
    res.json({ success: true, user });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    if (err instanceof Error && err.message === "INVALID_INPUT") {
      return res.status(400).json({ error: "Enter a password of at least 8 characters" });
    }
    throw err;
  }
}
