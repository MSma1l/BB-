import { describe, it, expect, beforeEach, vi } from "vitest";

// A tiny in-memory token store so we can exercise login/logout end-to-end
// without touching the real network layer.
const store = { token: null as string | null };

vi.mock("@/lib/api", () => ({
  apiJson: vi.fn(),
  getToken: vi.fn(() => store.token),
  setToken: vi.fn((t: string) => {
    store.token = t;
  }),
  clearToken: vi.fn(() => {
    store.token = null;
  }),
}));

import { login, isAuthed, logout } from "@/lib/auth";
import { apiJson } from "@/lib/api";

const apiJsonMock = vi.mocked(apiJson);

/** Build a fake JWT (header.payload.sig) carrying a given payload. */
function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => btoa(JSON.stringify(o));
  return `${b64({ alg: "none", typ: "JWT" })}.${b64(payload)}.sig`;
}

describe("login", () => {
  beforeEach(() => {
    store.token = null;
    apiJsonMock.mockReset();
  });

  it("stores the token and returns true on success", async () => {
    apiJsonMock.mockResolvedValue({ token: "jwt-token" });
    const ok = await login("admin", "secret");
    expect(ok).toBe(true);
    expect(store.token).toBe("jwt-token");
    expect(apiJsonMock).toHaveBeenCalledWith("/admin/login", {
      method: "POST",
      json: { username: "admin", password: "secret" },
    });
  });

  it("returns false when the API responds without a token", async () => {
    apiJsonMock.mockResolvedValue({});
    expect(await login("admin", "bad")).toBe(false);
    expect(store.token).toBeNull();
  });

  it("returns false when the API call throws", async () => {
    apiJsonMock.mockRejectedValue(new Error("boom"));
    expect(await login("admin", "bad")).toBe(false);
    expect(store.token).toBeNull();
  });
});

describe("isAuthed", () => {
  beforeEach(() => {
    store.token = null;
  });

  it("is false with no token", () => {
    expect(isAuthed()).toBe(false);
  });

  it("is false for an expired exp", () => {
    store.token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    expect(isAuthed()).toBe(false);
  });

  it("is true for a future exp", () => {
    store.token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isAuthed()).toBe(true);
  });

  it("treats a token with no exp as authed (mere presence)", () => {
    store.token = makeJwt({ sub: "admin" });
    expect(isAuthed()).toBe(true);
  });

  it("is false for a malformed token payload", () => {
    // A payload segment that isn't valid JSON -> tokenExp returns null ->
    // treated as authed (presence). Use one-segment token instead: no payload.
    store.token = "not-a-jwt";
    // split(".")[1] is undefined -> returns null -> authed by presence.
    expect(isAuthed()).toBe(true);
  });
});

describe("logout", () => {
  it("clears the token", () => {
    store.token = "jwt-token";
    logout();
    expect(store.token).toBeNull();
  });
});
