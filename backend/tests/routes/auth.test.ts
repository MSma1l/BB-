import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the SSE hub so nothing tries to write to real clients.
vi.mock("../../src/sse", () => ({
  broadcast: vi.fn(),
  sseHandler: () => (_req: unknown, _res: unknown) => {},
}));

// Mock Prisma (no real DB).
vi.mock("../../src/db", () => ({
  prisma: {
    adminUser: { findUnique: vi.fn() },
    conversation: { findMany: vi.fn() },
  },
  toMs: (v: bigint | number) => Number(v),
}));

// Mock bcryptjs (default import in the route).
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

import { createApp } from "../../src/app";
import { prisma } from "../../src/db";
import bcrypt from "bcryptjs";

const app = createApp();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const compare = (bcrypt as any).compare as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/login", () => {
  it("400 when username/password missing", async () => {
    const res = await request(app).post("/api/admin/login").send({ username: "admin" });
    expect(res.status).toBe(400);
  });

  it("401 when user not found", async () => {
    db.adminUser.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "secret" });
    expect(res.status).toBe(401);
  });

  it("401 when bcrypt.compare is false", async () => {
    db.adminUser.findUnique.mockResolvedValue({
      id: "u1",
      username: "admin",
      passwordHash: "hash",
    });
    compare.mockResolvedValue(false);
    const res = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("200 with { token } when credentials valid", async () => {
    db.adminUser.findUnique.mockResolvedValue({
      id: "u1",
      username: "admin",
      passwordHash: "hash",
    });
    compare.mockResolvedValue(true);
    const res = await request(app)
      .post("/api/admin/login")
      .send({ username: "admin", password: "right" });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBeGreaterThan(0);
  });
});

describe("auth-gated routes without a Bearer token", () => {
  it("GET /api/admin/me → 401", async () => {
    const res = await request(app).get("/api/admin/me");
    expect(res.status).toBe(401);
  });

  it("GET /api/conversations → 401", async () => {
    const res = await request(app).get("/api/conversations");
    expect(res.status).toBe(401);
    expect(db.conversation.findMany).not.toHaveBeenCalled();
  });
});
