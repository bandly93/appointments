import { Request, Response } from "express";
import { listUsers, createUser } from "./users.service.js";

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
