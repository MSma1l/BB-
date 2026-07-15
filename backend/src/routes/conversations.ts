import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { toMs } from "../db";
import { optionalAdmin, requireAdmin } from "../middleware/auth";
import { chatMessageLimiter, publicWriteLimiter } from "../middleware/rateLimit";
import { broadcast, sseHandler } from "../sse";
import { stripTags } from "../sanitize";
import { asyncHandler } from "../asyncHandler";
import { notifyVisitorMessage } from "../telegram";
import { MAX_MESSAGE_LEN, MAX_NAME_LEN, MAX_PHONE_LEN } from "../constants";

export const conversationsRouter = Router();

// Strip HTML from visitor-supplied free text before storage (QA-1 BUG #1) and
// bound its length (QA-3 QA3-3). `.max()` runs on the raw input so a 100KB spray
// is rejected before processing; text must still be non-empty AFTER stripping
// (QA-3 QA3-2), so a tags-only message is a 400 rather than a stored blank.
const messageSchema = z.object({
  id: z.string().min(1),
  from: z.enum(["visitor", "operator"]),
  text: z.string().max(MAX_MESSAGE_LEN).transform(stripTags).pipe(z.string().min(1)),
  ts: z.number(),
});

const conversationSchema = z.object({
  id: z.string().min(1),
  first: z.string().max(MAX_NAME_LEN).transform(stripTags),
  last: z.string().max(MAX_NAME_LEN).transform(stripTags),
  phone: z.string().max(MAX_PHONE_LEN).transform(stripTags),
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

// GET /api/conversations/:id (public capability URL) → one conversation or 404.
// Intentionally public: an anonymous visitor must be able to reload their own
// thread (and see operator replies) without a token. Enumeration is prevented by
// the conversation id being high-entropy/unguessable (client generates it with
// crypto random), not sequential — so this behaves like an unguessable share
// link. Requiring admin auth here would break the visitor experience (QA-3 QA3-5).
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
conversationsRouter.post("/", publicWriteLimiter, asyncHandler(async (req, res) => {
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
  // Ping the owner's Telegram with the visitor's first message (fire-and-forget:
  // a Telegram outage must not affect the site response).
  const firstMsg = conv.messages.find((m) => m.from === "visitor");
  if (firstMsg) {
    void notifyVisitorMessage({
      conversationId: conv.id,
      first: conv.first,
      last: conv.last,
      phone: conv.phone,
      text: firstMsg.text,
    });
  }
  res.status(201).json(serializeConversation(conv));
}));

// POST /api/conversations/:id/messages → append a message.
// Public for visitors, but rate-limited (QA-3 QA3-4) and — critically — only an
// authenticated admin may post as the operator (QA-3 QA3-1), so nobody can inject
// a fake "operator" reply into a visitor's thread. `optionalAdmin` runs first so
// the limiter can exempt admins and the operator check can see `req.admin`.
conversationsRouter.post("/:id/messages", optionalAdmin, chatMessageLimiter, asyncHandler(async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid message payload" });
    return;
  }
  if (parsed.data.from === "operator" && !req.admin) {
    res.status(401).json({ error: "Operator messages require admin authentication" });
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
  // Only visitor messages ping Telegram (operator replies already originate from
  // the admin/Telegram side). Fire-and-forget.
  if (from === "visitor") {
    void notifyVisitorMessage({
      conversationId: convId,
      first: exists.first,
      last: exists.last,
      phone: exists.phone,
      text,
    });
  }
  res.status(201).json(serializeMessage(message));
}));
