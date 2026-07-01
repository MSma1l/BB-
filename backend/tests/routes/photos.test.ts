import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/sse", () => ({
  broadcast: vi.fn(),
  sseHandler: () => (_req: unknown, _res: unknown) => {},
}));

vi.mock("../../src/db", () => ({
  prisma: {
    photoGroup: { findUnique: vi.fn(), upsert: vi.fn() },
  },
  toMs: (v: bigint | number) => Number(v),
}));

import { createApp } from "../../src/app";
import { prisma } from "../../src/db";
import { PHOTO_DEFAULTS } from "../../src/constants";

const app = createApp();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/photos/:group", () => {
  it("returns defaults when no row exists", async () => {
    db.photoGroup.findUnique.mockResolvedValue(null);
    const res = await request(app).get("/api/photos/gallery");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(PHOTO_DEFAULTS.gallery);
  });

  it("returns the stored urls when a row exists", async () => {
    db.photoGroup.findUnique.mockResolvedValue({
      id: "profile",
      urls: ["/uploads/a.jpg", "/uploads/b.jpg"],
    });
    const res = await request(app).get("/api/photos/profile");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(["/uploads/a.jpg", "/uploads/b.jpg"]);
  });

  it("400 for an unknown group", async () => {
    const res = await request(app).get("/api/photos/bogus");
    expect(res.status).toBe(400);
    expect(db.photoGroup.findUnique).not.toHaveBeenCalled();
  });
});
