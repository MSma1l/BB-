import "dotenv/config";

/** Typed, validated environment config. Fails fast on missing critical vars. */
function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

const isProd = process.env.NODE_ENV === "production";

// Values that must never be used in production (they ship in the repo / are
// well-known). Fail fast so a real deploy can't run with a forgeable secret.
const KNOWN_WEAK_SECRETS = new Set([
  "dev-insecure-secret-change-me",
  "change-me-to-a-long-random-string",
]);
if (isProd) {
  const s = process.env.JWT_SECRET ?? "";
  if (s === "" || KNOWN_WEAK_SECRETS.has(s) || s.length < 16) {
    throw new Error(
      "Refusing to start in production with a missing/weak JWT_SECRET. " +
        "Set a strong unique value, e.g. `openssl rand -hex 32`.",
    );
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd,
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  // In dev we allow a weak default; in prod JWT_SECRET is mandatory.
  jwtSecret: isProd ? required("JWT_SECRET") : (process.env.JWT_SECRET || "dev-insecure-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminPassword: process.env.ADMIN_PASSWORD ?? "bbreeze-admin",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  // Max raw upload accepted (input cap, before compression).
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 12),
  // Hard ceiling for the STORED image after compression (WebP). Kept well below
  // this in practice; guarantees no stored image exceeds it.
  imageMaxMb: Number(process.env.IMAGE_MAX_MB ?? 5),
  // Telegram bot: notifies the owner's group on new visitor messages. Empty =
  // feature disabled (dev/tests run without it). See src/telegram.ts.
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  // Public origin of the site, used to build the admin-panel link in Telegram
  // notifications (no trailing slash).
  publicSiteUrl: (process.env.PUBLIC_SITE_URL ?? "https://balloonsbreeze.md").replace(/\/+$/, ""),
} as const;
