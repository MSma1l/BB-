import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import {
  signAdminToken,
  verifyAdminToken,
  requireAdmin,
  type AdminPayload,
} from "../../src/middleware/auth";
import { env } from "../../src/env";

const payload: AdminPayload = { sub: "user-1", username: "admin" };

describe("signAdminToken / verifyAdminToken", () => {
  it("round-trips the payload", () => {
    const token = signAdminToken(payload);
    const decoded = verifyAdminToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.username).toBe(payload.username);
  });

  it("fails when signed with a different secret", () => {
    const token = jwt.sign(payload, "some-other-secret-entirely");
    expect(() => verifyAdminToken(token)).toThrow();
  });

  it("rejects a token whose alg is not HS256", () => {
    // Pin verification to HS256; an HS384 token must be rejected.
    const token = jwt.sign(payload, env.jwtSecret, { algorithm: "HS384" });
    expect(() => verifyAdminToken(token)).toThrow();
  });

  it("rejects a garbage token", () => {
    expect(() => verifyAdminToken("not-a-jwt")).toThrow();
  });
});

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe("requireAdmin", () => {
  it("responds 401 when the Authorization header is missing", () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = vi.fn();
    requireAdmin(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 401 for a non-Bearer scheme", () => {
    const req = { headers: { authorization: "Basic abc" } } as Request;
    const res = mockRes();
    const next = vi.fn();
    requireAdmin(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 401 for an invalid Bearer token", () => {
    const req = { headers: { authorization: "Bearer garbage.token.here" } } as Request;
    const res = mockRes();
    const next = vi.fn();
    requireAdmin(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() and sets req.admin for a valid Bearer token", () => {
    const token = signAdminToken(payload);
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = vi.fn();
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.admin?.username).toBe("admin");
    expect(req.admin?.sub).toBe("user-1");
  });
});
