/**
 * Idempotent seed: creates/updates the admin user (from env) and seeds the three
 * photo groups with their default image lists if they don't exist yet.
 * Safe to run on every container start.
 */
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { env } from "./env";
import { PHOTO_DEFAULTS, PHOTO_GROUP_IDS } from "./constants";

async function main() {
  // Admin user — upsert so a changed ADMIN_PASSWORD in env takes effect on restart.
  const passwordHash = await bcrypt.hash(env.adminPassword, 10);
  await prisma.adminUser.upsert({
    where: { username: env.adminUsername },
    update: { passwordHash },
    create: { username: env.adminUsername, passwordHash },
  });
  console.log(`Seeded admin user "${env.adminUsername}".`);

  // Photo groups — only create if missing (don't clobber admin edits).
  for (const id of PHOTO_GROUP_IDS) {
    const existing = await prisma.photoGroup.findUnique({ where: { id } });
    if (!existing) {
      await prisma.photoGroup.create({ data: { id, urls: PHOTO_DEFAULTS[id] } });
      console.log(`Seeded photo group "${id}".`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
