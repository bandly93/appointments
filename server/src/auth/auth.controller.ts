import { Request, Response } from 'express';
import { verifyPassword } from './password.js';
import { prisma } from "../lib/prisma.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase()
    }
  })

  if (!user) {
    return res.status(401).json({
      error: 'Invalid email or password',
    });
  }

  const passwordIsValid = await verifyPassword(
    user.passwordHash,
    password
  );

  if (!passwordIsValid) {
    return res.status(401).json({
      error: 'Invalid email or password',
    });
  }
  
  res.json({
    success: true,
    message: 'Login successful',
  });
}