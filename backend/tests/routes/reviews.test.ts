import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { broadcast } from "../../src/sse";

vi.mock("../../src/sse", () => ({
  broadcast: vi.fn(),
  sseHandler: () => (_req: unknown, _res: unknown) => {},
}));

vi.mock("../../src/db", () => ({
  prisma: {
    review: { create: vi.fn(), findMany: vi.fn() },
  },
  toMs: (v: bigint | number) => Number(v),
}));

import { createApp } from "../../src/app";
import { prisma } from "../../src/db";

const app = createApp();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/reviews", () => {
  it("400 when rating is out of range", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({ name: "Ann", role: "bride", rating: 9, text: "great" });
    expect(res.status).toBe(400);
    expect(db.review.create).not.toHaveBeenCalled();
  });

  it("400 when required fields are missing", async () => {
    const res = await request(app).post("/api/reviews").send({ rating: 5 });
    expect(res.status).toBe(400);
    expect(db.review.create).not.toHaveBeenCalled();
  });

  it("201 with the serialized review on valid input", async () => {
    db.review.create.mockImplementation(async ({ data }: any) => ({
      id: data.id,
      name: data.name,
      role: data.role,
      rating: data.rating,
      text: data.text,
    }));

    const res = await request(app)
      .post("/api/reviews")
      .send({ name: "Ann", role: "bride", rating: 4.5, text: "Beautiful decor" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Ann",
      role: "bride",
      rating: 4.5,
      text: "Beautiful decor",
    });
    expect(typeof res.body.id).toBe("string");

    // created as unapproved and broadcast fired.
    expect(db.review.create).toHaveBeenCalledOnce();
    expect(db.review.create.mock.calls[0][0].data.approved).toBe(false);
    expect(broadcast).toHaveBeenCalledWith("reviews");
  });
});
