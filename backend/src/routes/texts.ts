import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAdmin } from "../middleware/auth";
import { isLocale } from "../constants";
import { broadcast, sseHandler } from "../sse";

export const textsRouter = Router();

type LocaleOverrides = Record<string, string>;
type AllOverrides = Record<string, LocaleOverrides>;

interface OverrideRow {
  locale: string;
  path: string;
  value: string;
}

function groupAll(rows: OverrideRow[]): AllOverrides {
  const out: AllOverrides = {};
  for (const row of rows) {
    (out[row.locale] ??= {})[row.path] = row.value;
  }
  return out;
}

function toMap(rows: OverrideRow[]): LocaleOverrides {
  const out: LocaleOverrides = {};
  for (const row of rows) out[row.path] = row.value;
  return out;
}

const putSchema = z.object({
  path: z.string().min(1),
  value: z.union([z.string(), z.number()]),
});

// GET /api/texts/stream → SSE (registered before /:locale)
textsRouter.get("/stream", sseHandler("texts"));

// GET /api/texts (public) → all overrides grouped by locale
textsRouter.get("/", async (_req, res) => {
  const rows = await prisma.textOverride.findMany();
  res.json(groupAll(rows));
});

// GET /api/texts/:locale (public) → that locale's { path: value } map
textsRouter.get("/:locale", async (req, res) => {
  const locale = req.params.locale;
  if (!isLocale(locale)) {
    res.status(400).json({ error: "Unknown locale" });
    return;
  }
  const rows = await prisma.textOverride.findMany({ where: { locale } });
  res.json(toMap(rows));
});

// PUT /api/texts/:locale (admin) → upsert one override
textsRouter.put("/:locale", requireAdmin, async (req, res) => {
  const locale = req.params.locale;
  if (!isLocale(locale)) {
    res.status(400).json({ error: "Unknown locale" });
    return;
  }
  const parsed = putSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "path and value are required" });
    return;
  }
  const { path, value } = parsed.data;
  await prisma.textOverride.upsert({
    where: { locale_path: { locale, path } },
    create: { locale, path, value: String(value) },
    update: { value: String(value) },
  });
  broadcast("texts");
  const rows = await prisma.textOverride.findMany({ where: { locale } });
  res.json(toMap(rows));
});

// DELETE /api/texts/:locale(?path=...) (admin) → clear one path or reset locale
textsRouter.delete("/:locale", requireAdmin, async (req, res) => {
  const locale = req.params.locale;
  if (!isLocale(locale)) {
    res.status(400).json({ error: "Unknown locale" });
    return;
  }
  const path = typeof req.query.path === "string" ? req.query.path : undefined;
  if (path) {
    await prisma.textOverride.deleteMany({ where: { locale, path } });
  } else {
    await prisma.textOverride.deleteMany({ where: { locale } });
  }
  broadcast("texts");
  const rows = await prisma.textOverride.findMany({ where: { locale } });
  res.json(toMap(rows));
});
