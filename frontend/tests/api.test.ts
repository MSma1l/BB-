import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  API_BASE,
  ApiError,
  apiFetch,
  clearToken,
  getToken,
  setToken,
  sse,
} from "@/lib/api";

describe("token storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a token through localStorage", () => {
    expect(getToken()).toBeNull();
    setToken("abc123");
    expect(getToken()).toBe("abc123");
    expect(window.localStorage.getItem("bb_admin_token")).toBe("abc123");
  });

  it("clears the token", () => {
    setToken("abc123");
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe("apiFetch", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockResponse(body: unknown, ok = true, status = 200): Response {
    return {
      ok,
      status,
      json: async () => body,
    } as unknown as Response;
  }

  it("attaches an Authorization Bearer header when a token is set", async () => {
    setToken("tok-42");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/reviews");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}/reviews`);
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok-42",
    );
  });

  it("omits the Authorization header when no token is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/reviews");
    const [, init] = fetchMock.mock.calls[0];
    expect(
      (init.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });

  it("serializes a json body and sets the Content-Type header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/reviews", { method: "POST", json: { a: 1 } });
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("throws an ApiError on a non-2xx response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ error: "nope" }, false, 403));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/admin/thing")).rejects.toBeInstanceOf(ApiError);
    try {
      await apiFetch("/admin/thing");
    } catch (e) {
      const err = e as ApiError;
      expect(err.status).toBe(403);
      expect(err.message).toBe("nope");
    }
  });
});

describe("sse", () => {
  it("returns a no-op unsubscribe when EventSource is undefined", () => {
    // jsdom does not implement EventSource.
    expect(typeof (globalThis as Record<string, unknown>).EventSource).toBe(
      "undefined",
    );
    const off = sse("/reviews/stream", () => {});
    expect(typeof off).toBe("function");
    expect(() => off()).not.toThrow();
  });
});
