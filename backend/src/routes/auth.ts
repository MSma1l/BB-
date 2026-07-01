import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { env } from "../env";
import { requireAdmin, signAdminToken } from "../middleware/auth";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /api/admin/login → { token, expiresIn }
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }
  const { username, password } = parsed.data;
  const user = await prisma.adminUser.findUnique({ where: { username: username.trim() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signAdminToken({ sub: user.id, username: user.username });
  res.json({ token, expiresIn: env.jwtExpiresIn });
});

// GET /api/admin/me → { username }
authRouter.get("/me", requireAdmin, (req, res) => {
  res.json({ username: req.admin!.username });
});
