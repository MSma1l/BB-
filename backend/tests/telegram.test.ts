import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The Telegram bridge is OPT-IN: with no TELEGRAM_BOT_TOKEN (the default in the
// test env, see tests/setup.ts) it must be a complete no-op — never touch the
// network — so the site's chat keeps working with the feature switched off.
vi.mock("../src/db", () => ({
  prisma: {
    setting: { findUnique: vi.fn(), upsert: vi.fn() },
    telegramNotice: { create: vi.fn(), findUnique: vi.fn() },
    conversation: { findUnique: vi.fn(), update: vi.fn() },
    chatMessage: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  toMs: (v: bigint | number) => Number(v),
}));
vi.mock("../src/sse", () => ({ broadcast: vi.fn() }));

import { telegramEnabled, notifyVisitorMessage, startTelegramBot } from "../src/telegram";

describe("telegram bridge (disabled without a token)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is disabled when TELEGRAM_BOT_TOKEN is unset", () => {
    expect(telegramEnabled).toBe(false);
  });

  it("notifyVisitorMessage is a no-op (no network call) when disabled", async () => {
    await notifyVisitorMessage({
      conversationId: "c1",
      first: "Ana",
      last: "Pop",
      phone: "+37360000000",
      text: "Salut!",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("startTelegramBot does not begin polling when disabled", async () => {
    await startTelegramBot();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
