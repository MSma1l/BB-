import type { Conversation, Locale } from "@/lib/types";
import { getDictionary } from "@/content/i18n";

// Mock conversations powering the chat widget + admin inbox.
//
// In the DC prototype these lived in localStorage; here they are seeded mock
// data held in React state. No real persistence is in scope for this repo.
// Timestamps are fixed constants (not Date.now()) so server and client render
// identically — avoiding hydration mismatches.

const MIN = 60_000;
// Fixed reference instant for deterministic, hydration-safe times.
const BASE = Date.UTC(2026, 5, 29, 14, 30, 0); // 2026-06-29 14:30 UTC

/** Demo conversations shown in the admin inbox (visitor-side, pre-seeded). */
export function getSeedConversations(locale: Locale): Conversation[] {
  const t = getDictionary(locale);
  return [
    {
      id: "demo-elena",
      name: "Elena · Chișinău",
      ts: BASE - 4 * MIN,
      messages: [
        { id: "m1", from: "operator", text: t.chat.greeting, ts: BASE - 30 * MIN },
        {
          id: "m2",
          from: "visitor",
          text: "Здравствуйте! Планируем свадьбу на 120 гостей в августе.",
          ts: BASE - 12 * MIN,
        },
        {
          id: "m3",
          from: "operator",
          text: "Поздравляем! 🎉 Подберём арку, фотозону и оформление зала. Какой бюджет ориентировочно?",
          ts: BASE - 8 * MIN,
        },
        {
          id: "m4",
          from: "visitor",
          text: "Хотим премиальный декор, пришлите, пожалуйста, примеры.",
          ts: BASE - 4 * MIN,
        },
      ],
    },
    {
      id: "demo-andrei",
      name: "Andrei · Corporate",
      ts: BASE - 22 * MIN,
      messages: [
        { id: "m1", from: "operator", text: t.chat.greeting, ts: BASE - 50 * MIN },
        {
          id: "m2",
          from: "visitor",
          text: "Нужно оформление на открытие шоурума 15 июля.",
          ts: BASE - 26 * MIN,
        },
        {
          id: "m3",
          from: "operator",
          text: "Отлично, сделаем под ключ — брендированные шары, welcome-зона и свет. 👍",
          ts: BASE - 22 * MIN,
        },
      ],
    },
    {
      id: "demo-maria",
      name: "Maria · Birthday",
      ts: BASE - 75 * MIN,
      messages: [
        { id: "m1", from: "operator", text: t.chat.greeting, ts: BASE - 90 * MIN },
        {
          id: "m2",
          from: "visitor",
          text: "Детский день рождения, тема — космос 🚀",
          ts: BASE - 75 * MIN,
        },
      ],
    },
  ];
}

// BACKEND: replace with a real fetch / websocket subscription. The chat + admin
// UI consumes Conversation[] and is otherwise untouched by the data source.
export async function getConversations(locale: Locale): Promise<Conversation[]> {
  return getSeedConversations(locale);
  // LATER: return fetch("/api/conversations").then((r) => r.json());
}
