import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image uploads are allowed"));
    }
  },
});

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

// POST /api/photos/:group/upload (admin) → store file, return its url
photosRouter.post("/:group/upload", requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  res.json({ url: "/uploads/" + req.file.filename });
});
