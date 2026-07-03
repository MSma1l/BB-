import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";

export interface AdminPayload {
  sub: string;
  username: string;
}

/** Sign a short-lived admin access token. */
export function signAdminToken(payload: AdminPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

/** Verify + decode an admin token, or throw. Algorithm pinned to HS256. */
export function verifyAdminToken(token: string): AdminPayload {
  return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] }) as AdminPayload;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

/** Gate: requires a valid `Authorization: Bearer <jwt>` header. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  try {
    req.admin = verifyAdminToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Non-gating variant of {@link requireAdmin}: if a valid Bearer token is present
 * it attaches `req.admin`; otherwise the request continues as anonymous. Lets an
 * endpoint serve anonymous visitors while still recognizing an authenticated
 * admin — e.g. so only admins may post "operator" chat messages (QA-3 QA3-1).
 */
export function optionalAdmin(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      req.admin = verifyAdminToken(token);
    } catch {
      /* invalid / expired token → treat as anonymous */
    }
  }
  next();
}
