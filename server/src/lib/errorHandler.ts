import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

// Must take 4 args (even though `next` goes unused) — that arity is how
// Express recognizes error-handling middleware.
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  if (err instanceof SyntaxError && (err as { status?: number }).status === 400 && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON" });
  }

  res.status(500).json({ error: "Internal server error" });
}
