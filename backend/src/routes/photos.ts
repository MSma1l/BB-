import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { z } from "zod";
import { prisma } from "../db";
import { env } from "../env";
import { requireAdmin } from "../middleware/auth";
import { PHOTO_DEFAULTS, isPhotoGroup } from "../constants";
import { broadcast, sseHandler } from "../sse";

export const photosRouter = Router();

// Ensure the upload directory exists.
const uploadRoot = path.resolve(env.uploadDir);
fs.mkdirSync(uploadRoot, { recursive: true });

// Allowlist of safe raster input types (mimetype is client-controlled, so this
// only gates obvious junk / SVG/HTML). Output is always re-encoded to WebP.
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Buffer the upload in memory so sharp can compress it before it touches disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP, or GIF images are allowed"));
    }
  },
});

/**
 * Compress an uploaded image as small as possible while staying ≤ targetBytes.
 * Auto-rotates (EXIF), caps the largest side, and re-encodes to WebP at max
 * effort, stepping quality (and finally dimensions) down until it fits. In
 * practice a resized WebP lands far under a few-MB target on the first step —
 * the loop only guards huge sources.
 */
async function compressImage(
  buffer: Buffer,
  mimetype: string,
  targetBytes: number,
): Promise<Buffer> {
  const animated = mimetype === "image/gif";
  const pipe = () =>
    sharp(buffer, { animated })
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true });

  for (const quality of [82, 70, 58, 48, 38]) {
    const out = await pipe().webp({ quality, effort: 6 }).toBuffer();
    if (out.length <= targetBytes) return out;
  }
  // Last resort for very large sources: shrink further at lowest quality.
  return sharp(buffer, { animated })
    .rotate()
    .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 36, effort: 6 })
    .toBuffer();
}

const imagesSchema = z.object({
  images: z.array(z.string()),
});

// GET /api/photos/stream → SSE (registered before /:group)
photosRouter.get("/stream", sseHandler("photos"));

// GET /api/photos/:group (public) → current urls (or defaults if no row)
photosRouter.get("/:group", async (req, res) => {
  const group = req.params.group;
  if (!isPhotoGroup(group)) {
    res.status(400).json({ error: "Unknown photo group" });
    return;
  }
  const row = await prisma.photoGroup.findUnique({ where: { id: group } });
  res.json(row ? row.urls : PHOTO_DEFAULTS[group]);
});

// PUT /api/photos/:group (admin) → set the group's urls
photosRouter.put("/:group", requireAdmin, async (req, res) => {
  const group = req.params.group;
  if (!isPhotoGroup(group)) {
    res.status(400).json({ error: "Unknown photo group" });
    return;
  }
  const parsed = imagesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "images must be an array of strings" });
    return;
  }
  const { images } = parsed.data;
  await prisma.photoGroup.upsert({
    where: { id: group },
    create: { id: group, urls: images },
    update: { urls: images },
  });
  broadcast("photos");
  res.json(images);
});

// DELETE /api/photos/:group (admin) → reset to defaults
photosRouter.delete("/:group", requireAdmin, async (req, res) => {
  const group = req.params.group;
  if (!isPhotoGroup(group)) {
    res.status(400).json({ error: "Unknown photo group" });
    return;
  }
  const defaults = PHOTO_DEFAULTS[group];
  await prisma.photoGroup.upsert({
    where: { id: group },
    create: { id: group, urls: defaults },
    update: { urls: defaults },
  });
  broadcast("photos");
  res.json(defaults);
});

// POST /api/photos/:group/upload (admin) → compress → store → return its url
photosRouter.post("/:group/upload", requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  try {
    const targetBytes = env.imageMaxMb * 1024 * 1024;
    const out = await compressImage(req.file.buffer, req.file.mimetype, targetBytes);
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.webp`;
    await fs.promises.writeFile(path.join(uploadRoot, name), out);
    res.json({ url: "/uploads/" + name });
  } catch {
    res.status(500).json({ error: "Image processing failed" });
  }
});
