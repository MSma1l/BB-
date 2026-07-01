import fs from "node:fs";
import path from "node:path";
import { createApp } from "./app";
import { env } from "./env";

// Ensure the upload directory exists before serving it.
fs.mkdirSync(path.resolve(env.uploadDir), { recursive: true });

const app = createApp();
app.listen(env.port, () => {
  console.log(`Balloons Breeze API listening on :${env.port} (${env.nodeEnv})`);
});
