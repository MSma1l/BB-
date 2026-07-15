/**
 * Telegram bridge — notifies the owner's Telegram group when a visitor writes on
 * the site, and lets the owner reply straight from Telegram (the reply is posted
 * back into the visitor's chat thread on the site).
 *
 * Design goals:
 *  - Self-contained & optional: if TELEGRAM_BOT_TOKEN is unset the whole module
 *    is a no-op, so dev/tests run without a bot.
 *  - Zero-config for the owner: they add the bot to a group (topics enabled) and
 *    send `/register`. The bot grabs the chat id, auto-creates a dedicated topic
 *    ("🔔 Mesaje site"), and remembers both in the DB (Setting rows). No ids to
 *    copy by hand.
 *  - Never affects the HTTP response: notifications are fire-and-forget; a
 *    Telegram outage can't break the site's chat.
 *
 * Transport: long-polling (getUpdates). No public webhook URL required, so it
 * works behind nginx / on any host. A single backend instance polls.
 */

import { randomUUID } from "node:crypto";
import { prisma } from "./db";
import { broadcast } from "./sse";
import { env } from "./env";

const TOKEN = env.telegramBotToken;
const API = `https://api.telegram.org/bot${TOKEN}`;

/** Whether the bot is configured to run at all. */
export const telegramEnabled = TOKEN.length > 0;

// Setting keys used to persist the registered destination across restarts.
const KEY_CHAT_ID = "telegram_chat_id";
const KEY_TOPIC_ID = "telegram_topic_id";

interface Destination {
  chatId: string;
  /** Forum topic (message_thread_id), or null to post in the group's main feed. */
  topicId: number | null;
}

/** In-memory copy of the registered destination (hydrated from Setting on boot). */
let destination: Destination | null = null;

// ---- Telegram Bot API helpers ---------------------------------------------

interface TgResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

async function callTelegram<T>(
  method: string,
  params: Record<string, unknown>,
  timeoutMs = 15000,
): Promise<T | null> {
  if (!telegramEnabled) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    const data = (await res.json()) as TgResponse<T>;
    if (!data.ok) {
      console.error(`[telegram] ${method} failed:`, data.description);
      return null;
    }
    return data.result ?? null;
  } catch (err) {
    console.error(`[telegram] ${method} error:`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Escape user-supplied text for Telegram HTML parse mode. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---- Persisted destination -------------------------------------------------

async function getSetting(key: string): Promise<string | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row?.value ?? null;
  } catch {
    return null;
  }
}

async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

async function loadDestination(): Promise<void> {
  const chatId = await getSetting(KEY_CHAT_ID);
  if (!chatId) {
    destination = null;
    return;
  }
  const topicRaw = await getSetting(KEY_TOPIC_ID);
  destination = { chatId, topicId: topicRaw ? Number(topicRaw) : null };
}

async function saveDestination(dest: Destination): Promise<void> {
  destination = dest;
  await setSetting(KEY_CHAT_ID, dest.chatId);
  await setSetting(KEY_TOPIC_ID, dest.topicId === null ? "" : String(dest.topicId));
}

// ---- Public: notify on a new visitor message -------------------------------

export interface VisitorNotice {
  conversationId: string;
  first: string;
  last: string;
  phone: string;
  text: string;
}

/**
 * Announce a fresh visitor message in the registered Telegram topic. Records the
 * posted message id → conversation id so an owner *replying* to it in Telegram is
 * routed back to the right site thread. Fire-and-forget: callers should not await.
 */
export async function notifyVisitorMessage(notice: VisitorNotice): Promise<void> {
  if (!telegramEnabled || !destination) return;

  const name = `${notice.first} ${notice.last}`.trim() || "Vizitator";
  const link = `${env.publicSiteUrl}/admin-bb`;
  const body =
    `🔔 <b>Mesaj nou pe site</b>\n` +
    `👤 <b>${esc(name)}</b>\n` +
    (notice.phone ? `📞 ${esc(notice.phone)}\n` : "") +
    `\n💬 ${esc(notice.text)}\n` +
    `\n↩️ <i>Răspunde la acest mesaj</i> ca să-i scrii clientului direct pe site,\n` +
    `sau deschide panoul de administrare:\n${esc(link)}`;

  const params: Record<string, unknown> = {
    chat_id: destination.chatId,
    text: body,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (destination.topicId !== null) params.message_thread_id = destination.topicId;

  let sent = await callTelegram<{ message_id: number }>("sendMessage", params);
  // Self-heal: if the saved topic is gone (deleted/recreated → "thread not
  // found"), the first send fails. Retry in the group's main feed and, if that
  // works (so the chat itself is reachable — a genuine topic problem, not a
  // transient outage), persist the downgrade so we stop targeting the dead topic.
  if (!sent && params.message_thread_id !== undefined) {
    delete params.message_thread_id;
    sent = await callTelegram<{ message_id: number }>("sendMessage", params);
    if (sent) await saveDestination({ chatId: destination.chatId, topicId: null });
  }
  if (!sent) return;

  // Remember the mapping so a Telegram reply reaches this conversation.
  try {
    await prisma.telegramNotice.create({
      data: {
        chatId: destination.chatId,
        messageId: sent.message_id,
        conversationId: notice.conversationId,
      },
    });
  } catch {
    /* mapping is best-effort; a missing row just disables reply-routing for it */
  }
}

// ---- Incoming updates (commands + owner replies) ---------------------------

interface TgChat {
  id: number;
  type: string;
  title?: string;
  is_forum?: boolean;
}
interface TgUser {
  id: number;
  username?: string;
  first_name?: string;
}
interface TgMessage {
  message_id: number;
  chat: TgChat;
  from?: TgUser;
  text?: string;
  message_thread_id?: number;
  reply_to_message?: { message_id: number };
}
interface TgUpdate {
  update_id: number;
  message?: TgMessage;
}

const INTRO =
  "👋 <b>Salut! Sunt botul Balloons Breeze.</b>\n\n" +
  "Rolul meu: de fiecare dată când un vizitator scrie pe site (în chat-ul de pe pagină), " +
  "primești aici, instant, o notificare cu numele, telefonul și mesajul lui — ca să nu " +
  "pierzi niciun client.\n\n" +
  "Ce poți face:\n" +
  "• 📩 vezi mesajele noi de pe site chiar aici, în acest topic;\n" +
  "• ↩️ <b>răspunde la o notificare</b> (reply) și mesajul tău ajunge direct la client, pe site;\n" +
  "• 🖥️ sau deschizi panoul de administrare pentru a răspunde de acolo.\n\n" +
  "Comenzi: /register — mă configurez în acest grup · /help — acest mesaj.";

/** Handle `/register` — bind to this chat and create a dedicated topic. */
async function handleRegister(msg: TgMessage): Promise<void> {
  const chatId = String(msg.chat.id);
  // Prefer a dedicated topic we create; otherwise post in the group's main feed.
  // We do NOT fall back to the thread /register happened to be sent in — that
  // thread can be a non-postable/ephemeral one and would break sends later.
  let topicId: number | null = null;

  // If the group is a forum (topics on) and the bot may manage topics, make our
  // own dedicated topic. If it fails (no rights), topicId stays null → main feed.
  if (msg.chat.is_forum) {
    const topic = await callTelegram<{ message_thread_id: number }>("createForumTopic", {
      chat_id: chatId,
      name: "🔔 Mesaje site — Balloons Breeze",
    });
    if (topic) topicId = topic.message_thread_id;
  }

  await saveDestination({ chatId, topicId });

  const where: Record<string, unknown> = { chat_id: chatId, parse_mode: "HTML" };
  if (topicId !== null) where.message_thread_id = topicId;

  const confirm =
    "✅ <b>Gata, m-am configurat!</b>\n\n" +
    (topicId !== null
      ? "Voi trimite toate mesajele noi de pe site în acest topic dedicat.\n\n"
      : "Voi trimite toate mesajele noi de pe site în acest grup.\n" +
        "<i>Sfat: activează „Topics/Subiecte” în setările grupului și dă din nou " +
        "/register ca să-mi creez un topic separat.</i>\n\n") +
    INTRO;
  await callTelegram("sendMessage", { ...where, text: confirm, disable_web_page_preview: true });
}

/** Handle an owner replying to a notification → post it back to the site. */
async function handleReply(msg: TgMessage): Promise<void> {
  const text = (msg.text ?? "").trim();
  if (!text) return;
  const repliedId = msg.reply_to_message?.message_id;
  if (repliedId === undefined) return;

  const notice = await prisma.telegramNotice.findUnique({
    where: { chatId_messageId: { chatId: String(msg.chat.id), messageId: repliedId } },
  });
  if (!notice) return; // reply to something that isn't one of our notifications

  const conv = await prisma.conversation.findUnique({ where: { id: notice.conversationId } });
  if (!conv) return;

  const ts = Date.now();
  await prisma.$transaction([
    prisma.chatMessage.create({
      data: { id: randomUUID(), conversationId: conv.id, from: "operator", text, ts: BigInt(ts) },
    }),
    prisma.conversation.update({ where: { id: conv.id }, data: { ts: BigInt(ts) } }),
  ]);
  broadcast("conversations");

  // Acknowledge in Telegram so the owner sees it was delivered.
  const ack: Record<string, unknown> = {
    chat_id: msg.chat.id,
    text: "✅ Trimis clientului pe site.",
    reply_to_message_id: msg.message_id,
  };
  if (msg.message_thread_id !== undefined) ack.message_thread_id = msg.message_thread_id;
  await callTelegram("sendMessage", ack);
}

/** Whether this message's sender is an authorized bot admin (by @username). */
function isAdminSender(msg: TgMessage): boolean {
  const uname = msg.from?.username?.toLowerCase();
  return uname !== undefined && env.telegramAdminUsernames.includes(uname);
}

async function handleUpdate(update: TgUpdate): Promise<void> {
  const msg = update.message;
  if (!msg) return;

  const text = (msg.text ?? "").trim();
  // Commands may be suffixed with @botname in groups; strip that.
  const cmd = text.split(/\s|@/)[0].toLowerCase();
  const isCommand = cmd.startsWith("/");

  // Only the site owner (@username in TELEGRAM_ADMIN_USERNAMES) may drive the bot
  // — run commands or have a reply forwarded to a visitor. Everyone else is
  // ignored, so a random group member can't reconfigure it or inject replies.
  if (isCommand || msg.reply_to_message) {
    if (!isAdminSender(msg)) {
      if (isCommand) {
        const admins = env.telegramAdminUsernames.map((u) => "@" + u).join(", ");
        const where: Record<string, unknown> = {
          chat_id: msg.chat.id,
          text: `⛔ Doar administratorul (${admins}) poate folosi comenzile botului.`,
        };
        if (msg.message_thread_id !== undefined) where.message_thread_id = msg.message_thread_id;
        await callTelegram("sendMessage", where);
      }
      return; // unauthorized reply → silently ignore
    }
  }

  if (cmd === "/register") return void (await handleRegister(msg));
  if (cmd === "/start" || cmd === "/help") {
    const where: Record<string, unknown> = { chat_id: msg.chat.id, parse_mode: "HTML", text: INTRO, disable_web_page_preview: true };
    if (msg.message_thread_id !== undefined) where.message_thread_id = msg.message_thread_id;
    return void (await callTelegram("sendMessage", where));
  }
  // Not a command → if it's a reply to one of our notifications, route it back.
  if (msg.reply_to_message) return void (await handleReply(msg));
}

// ---- Long-polling loop -----------------------------------------------------

let polling = false;

async function pollLoop(): Promise<void> {
  let offset = 0;
  // Long-poll with a 30s server-side wait; keep the client timeout a bit higher.
  while (polling) {
    const updates = await callTelegram<TgUpdate[]>(
      "getUpdates",
      { offset, timeout: 30, allowed_updates: ["message"] },
      40000,
    );
    if (!updates) {
      // Network hiccup / conflict — back off briefly, then retry.
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }
    for (const u of updates) {
      offset = u.update_id + 1;
      try {
        await handleUpdate(u);
      } catch (err) {
        console.error("[telegram] update handler error:", err);
      }
    }
  }
}

/** Start the bot (hydrate destination + begin polling). Safe to call once. */
export async function startTelegramBot(): Promise<void> {
  if (!telegramEnabled) {
    console.log("[telegram] TELEGRAM_BOT_TOKEN not set — bot disabled.");
    return;
  }
  if (polling) return;
  await loadDestination();
  // Drop any webhook so getUpdates works (a leftover webhook makes getUpdates 409).
  await callTelegram("deleteWebhook", { drop_pending_updates: false });
  polling = true;
  console.log(
    `[telegram] bot started (${destination ? "registered → chat " + destination.chatId : "not yet registered — send /register in your group"}).`,
  );
  void pollLoop();
}
