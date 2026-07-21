import { Request, Response } from 'express';
import { loginUser } from './auth.service.js';
import { setSessionCookie } from './sessions.js';

export async function login(req: Request, res: Response) {
  try {
    const { accessToken, refreshToken, expiresAt, user } = await loginUser(req.body);

    setSessionCookie(res, refreshToken, expiresAt);

    res.json({ success: true, accessToken, user });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (err instanceof Error && err.message === 'INVALID_INPUT') {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    throw err;
  }
}
