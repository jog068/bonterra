import type { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { message: 'Validation failed', fieldErrors: z.flattenError(err).fieldErrors },
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { message: 'Request body is not valid JSON' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
}
