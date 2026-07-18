import { Request, Response } from 'express';

export function login(req: Request, res: Response) {
  const { email, password } = req.body;

  console.log(email);
  console.log(password);

  res.json({
    success: true,
    message: 'Login successful',
  });
}