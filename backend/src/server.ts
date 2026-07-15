import fs from "node:fs";
import path from "node:path";
import { createApp } from "./app";
import { env } from "./env";
import { startTelegramBot } from "./telegram";

// Ensure the upload directory exists before serving it.
fs.mkdirSync(path.resolve(env.uploadDir), { recursive: true });

// Safety net (QA-4 QA4-01): a stray unhandled promise rejection would otherwise
// terminate the process under modern Node, turning any missed async error into a
// ~5s outage an attacker could trigger repeatedly. Route handlers are wrapped
// with asyncHandler so their rejections become clean HTTP responses; this only
// catches anything that slips past, logging instead of crashing.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection (kept process alive):", reason);
});

const app = createApp();
app.listen(env.port, () => {
  console.log(`Balloons Breeze API listening on :${env.port} (${env.nodeEnv})`);
  // Start the Telegram notifier (no-op if TELEGRAM_BOT_TOKEN is unset).
  void startTelegramBot();
});
