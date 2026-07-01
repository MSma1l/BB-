import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { toMs } from "../db";
import { requireAdmin } from "../middleware/auth";
import { publicWriteLimiter } from "../middleware/rateLimit";
import { broadcast, sseHandler } from "../sse";

export const conversationsRouter = Router();

const messageSchema = z.object({
  id: z.string().min(1),
  from: z.enum(["visitor", "operator"]),
  text: z.string(),
  ts: z.number(),
});

const conversationSchema = z.object({
  id: z.string().min(1),
  first: z.string(),
  last: z.string(),
  phone: z.string(),
  ts: z.number(),
  messages: z.array(messageSchema).default([]),
});

interface DbMessage {
  id: string;
  from: string;
  text: string;
  ts: bigint;
}

interface DbConversation {
  id: string;
  first: string;
  last: string;
  phone: string;
  ts: bigint;
  messages: DbMessage[];
}

function serializeMessage(m: DbMessage) {
  return { id: m.id, from: m.from, text: m.text, ts: toMs(m.ts) };
}

function serializeConversation(c: DbConversation) {
  return {
    id: c.id,
    first: c.first,
    last: c.last,
    phone: c.phone,
    ts: toMs(c.ts),
    messages: c.messages.map(serializeMessage),
  };
}

// GET /api/conversations/stream → SSE (registered before /:id)
conversationsRouter.get("/stream", sseHandler("conversations"));

// GET /api/conversations (admin) → all conversations, newest activity first
conversationsRouter.get("/", requireAdmin, async (_req, res) => {
  const rows = await prisma.conversation.findMany({
    orderBy: { ts: "desc" },
    include: { messages: { orderBy: { ts: "asc" } } },
  });
  res.json(rows.map(serializeConversation));
});

// GET /api/conversations/:id (public) → one conversation or 404
conversationsRouter.get("/:id", async (req, res) => {
  const conv = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: { messages: { orderBy: { ts: "asc" } } },
  });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json(serializeConversation(conv));
});

// POST /api/conversations (public) → create conversation + nested messages
conversationsRouter.post("/", publicWriteLimiter, async (req, res) => {
  const parsed = conversationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid conversation payload" });
    return;
  }
  const { id, first, last, phone, ts, messages } = parsed.data;
  const conv = await prisma.conversation.create({
    data: {
      id,
      first,
      last,
      phone,
      ts: BigInt(ts),
      messages: {
        create: messages.map((m) => ({
          id: m.id,
          from: m.from,
          text: m.text,
          ts: BigInt(m.ts),
        })),
      },
    },
    include: { messages: { orderBy: { ts: "asc" } } },
  });
  broadcast("conversations");
  res.status(201).json(serializeConversation(conv));
});

// POST /api/conversations/:id/messages (public) → append a message
conversationsRouter.post("/:id/messages", async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid message payload" });
    return;
  }
  const convId = req.params.id;
  const exists = await prisma.conversation.findUnique({ where: { id: convId } });
  if (!exists) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const { id, from, text, ts } = parsed.data;
  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: { id, conversationId: convId, from, text, ts: BigInt(ts) },
    }),
    prisma.conversation.update({
      where: { id: convId },
      data: { ts: BigInt(ts) },
    }),
  ]);
  broadcast("conversations");
  res.status(201).json(serializeMessage(message));
});
