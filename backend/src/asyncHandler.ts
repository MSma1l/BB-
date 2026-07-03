import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wrap an async Express handler so a rejected promise is forwarded to the error
 * middleware via next(err) instead of becoming an unhandledRejection.
 *
 * Express 4 does NOT catch errors thrown from async handlers, so an awaited
 * Prisma call that rejects (e.g. a duplicate-id unique-constraint violation)
 * would otherwise crash the process — QA-4 QA4-01 (duplicate conversation id →
 * 502) / QA4-03 (no graceful error handling). Wrapped handlers reach the global
 * error handler in app.ts, which maps known errors (P2002 → 409) to clean HTTP.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
