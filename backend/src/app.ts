import path from "node:path";
import express from "express";
import cors from "cors";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { conversationsRouter } from "./routes/conversations";
import { photosRouter } from "./routes/photos";
import { textsRouter } from "./routes/texts";
import { reviewsRouter } from "./routes/reviews";
import { contentRouter } from "./routes/content";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(",") }));
  app.use(express.json({ limit: "2mb" }));

  // Uploaded media (served at /uploads; nginx proxies this path to the backend).
  app.use("/uploads", express.static(path.resolve(env.uploadDir)));

  // Health check
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Domain routers
  app.use("/api/admin", authRouter);
  app.use("/api/conversations", conversationsRouter);
  app.use("/api/photos", photosRouter);
  app.use("/api/texts", textsRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/content", contentRouter);

  // 404 for unknown API routes
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  // Central error handler
  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const anyErr = err as { status?: number; message?: string };
      const status = anyErr?.status ?? 500;
      if (status >= 500) console.error(err);
      res.status(status).json({ error: anyErr?.message ?? "Server error" });
    },
  );

  return app;
}
