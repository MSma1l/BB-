import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAdmin } from "../middleware/auth";
import { broadcast, sseHandler } from "../sse";

export const reviewsRouter = Router();

interface DbReview {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
}

function serializeReview(r: DbReview) {
  return { id: r.id, name: r.name, role: r.role, rating: r.rating, text: r.text };
}

const createSchema = z.object({
  name: z.string().min(1),
  role: z.string(),
  rating: z.number().min(0.5).max(5),
  text: z.string(),
});

// GET /api/reviews/stream → SSE (registered before /:id)
reviewsRouter.get("/stream", sseHandler("reviews"));

// GET /api/reviews/pending (admin) → reviews awaiting moderation, newest first.
// Declared before any "/:id"-style route so it isn't captured as an id.
reviewsRouter.get("/pending", requireAdmin, async (_req, res) => {
  const rows = await prisma.review.findMany({
    where: { approved: false },
    orderBy: { ts: "desc" },
  });
  res.json(rows.map(serializeReview));
});

// GET /api/reviews (public) → approved reviews, newest first
reviewsRouter.get("/", async (_req, res) => {
  const rows = await prisma.review.findMany({
    where: { approved: true },
    orderBy: { ts: "desc" },
  });
  res.json(rows.map(serializeReview));
});

// POST /api/reviews (public) → create a review
reviewsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid review payload" });
    return;
  }
  const { name, role, rating, text } = parsed.data;
  const now = Date.now();
  const review = await prisma.review.create({
    data: {
      id: `u${now}`,
      name,
      role,
      rating,
      text,
      ts: BigInt(now),
      approved: false,
    },
  });
  broadcast("reviews");
  res.status(201).json(serializeReview(review));
});

// PUT /api/reviews/:id/approve (admin) → publish a pending review.
// updateMany makes a missing id a no-op (no throw).
reviewsRouter.put("/:id/approve", requireAdmin, async (req, res) => {
  await prisma.review.updateMany({
    where: { id: req.params.id },
    data: { approved: true },
  });
  broadcast("reviews");
  res.json({ ok: true });
});

// DELETE /api/reviews/:id (admin) → moderation delete
reviewsRouter.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.review.deleteMany({ where: { id: req.params.id } });
  broadcast("reviews");
  res.status(204).end();
});
