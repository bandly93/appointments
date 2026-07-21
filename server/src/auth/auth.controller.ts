import { Request, Response } from 'express';
import { loginUser, refreshSession, logoutUser } from './auth.service.js';
import { setSessionCookie, clearSessionCookie, InvalidSessionError } from './sessions.js';

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

export async function refresh(req: Request, res: Response) {
  try {
    const { accessToken, refreshToken, expiresAt, user } = await refreshSession(
      req.cookies?.refresh_token
    );

    setSessionCookie(res, refreshToken, expiresAt);

    res.json({ success: true, accessToken, user });
  } catch (err) {
    if (err instanceof InvalidSessionError) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Session expired' });
    }
    throw err;
  }
}

export async function logout(req: Request, res: Response) {
  await logoutUser(req.cookies?.refresh_token);
  clearSessionCookie(res);
  res.status(204).end();
}

export function me(req: Request, res: Response) {
  res.json({ success: true, user: req.user });
}
