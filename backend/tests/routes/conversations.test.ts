import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/sse", () => ({
  broadcast: vi.fn(),
  sseHandler: () => (_req: unknown, _res: unknown) => {},
}));

vi.mock("../../src/db", () => ({
  prisma: {
    conversation: { findUnique: vi.fn(), update: vi.fn() },
    chatMessage: { create: vi.fn() },
    // The route calls prisma.$transaction([create(...), update(...)]); the ops
    // are promises, so resolve them (like the real client) and return the
    // results — `const [message] = await prisma.$transaction(...)`.
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
  toMs: (v: bigint | number) => Number(v),
}));

import { createApp } from "../../src/app";
import { prisma } from "../../src/db";
import { signAdminToken } from "../../src/middleware/auth";

const app = createApp();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

const CONV = "c-11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  db.conversation.findUnique.mockResolvedValue({ id: CONV });
  db.conversation.update.mockResolvedValue({ id: CONV });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db.chatMessage.create.mockImplementation(async ({ data }: any) => ({
    id: data.id,
    from: data.from,
    text: data.text,
    ts: data.ts,
  }));
});

const url = `/api/conversations/${CONV}/messages`;

describe("POST /api/conversations/:id/messages", () => {
  it("201 for a valid visitor message (no auth needed)", async () => {
    const res = await request(app)
      .post(url)
      .send({ id: "m-1", from: "visitor", text: "Hello 🎈", ts: 123 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ from: "visitor", text: "Hello 🎈" });
    expect(db.chatMessage.create).toHaveBeenCalledOnce();
  });

  it("400 for empty text (QA3-2)", async () => {
    const res = await request(app)
      .post(url)
      .send({ id: "m-2", from: "visitor", text: "", ts: 123 });
    expect(res.status).toBe(400);
    expect(db.chatMessage.create).not.toHaveBeenCalled();
  });

  it("400 for tags-only text (empty after sanitize)", async () => {
    const res = await request(app)
      .post(url)
      .send({ id: "m-3", from: "visitor", text: "<b></b>", ts: 123 });
    expect(res.status).toBe(400);
    expect(db.chatMessage.create).not.toHaveBeenCalled();
  });

  it("400 for oversize text >4000 chars (QA3-3)", async () => {
    const res = await request(app)
      .post(url)
      .send({ id: "m-4", from: "visitor", text: "B".repeat(4001), ts: 123 });
    expect(res.status).toBe(400);
    expect(db.chatMessage.create).not.toHaveBeenCalled();
  });

  it("401 when posting as operator without a token (QA3-1)", async () => {
    const res = await request(app)
      .post(url)
      .send({ id: "m-5", from: "operator", text: "Fake admin reply", ts: 123 });
    expect(res.status).toBe(401);
    expect(db.chatMessage.create).not.toHaveBeenCalled();
  });

  it("201 when posting as operator WITH a valid admin token", async () => {
    const token = signAdminToken({ sub: "u1", username: "admin" });
    const res = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .send({ id: "m-6", from: "operator", text: "Real admin reply", ts: 123 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ from: "operator", text: "Real admin reply" });
  });
});
