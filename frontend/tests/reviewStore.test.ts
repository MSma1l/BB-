import { describe, it, expect, beforeEach, vi } from "vitest";

const apiFetch = vi.fn();
const apiJson = vi.fn();
const sse = vi.fn(() => () => {});

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
  apiJson: (...args: unknown[]) => apiJson(...args),
  sse: (...args: unknown[]) => sse(...args),
}));

type Store = typeof import("@/lib/reviewStore");

async function freshStore(): Promise<Store> {
  vi.resetModules();
  return import("@/lib/reviewStore");
}

const okResponse = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

beforeEach(() => {
  apiFetch.mockReset();
  apiJson.mockReset();
  // Default: network resolves with an empty-ish body so background .then()s
  // don't blow up. Individual tests override as needed.
  apiFetch.mockResolvedValue(okResponse({}));
});

describe("reviewStore", () => {
  it("loadReviews starts empty before hydration", async () => {
    const store = await freshStore();
    expect(store.loadReviews()).toEqual([]);
  });

  it("addReview optimistically prepends and returns the review", async () => {
    const store = await freshStore();
    const review = store.addReview(
      { name: "Ana", role: "Bride", rating: 5, text: "Lovely!" },
      1700000000000,
    );
    expect(review).not.toBeNull();
    expect(review!.id).toBe("u1700000000000");
    expect(review!.name).toBe("Ana");

    const list = store.loadReviews();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("u1700000000000");

    // POSTed to /reviews with the review body.
    expect(apiFetch).toHaveBeenCalledWith("/reviews", {
      method: "POST",
      json: { name: "Ana", role: "Bride", rating: 5, text: "Lovely!" },
    });
  });

  it("addReview prepends newest-first", async () => {
    const store = await freshStore();
    store.addReview({ name: "First", role: "r", rating: 4, text: "a" }, 1);
    store.addReview({ name: "Second", role: "r", rating: 4, text: "b" }, 2);
    const list = store.loadReviews();
    expect(list.map((r) => r.name)).toEqual(["Second", "First"]);
  });

  it("removeReview drops the review from the cache and DELETEs it", async () => {
    const store = await freshStore();
    const review = store.addReview(
      { name: "Ana", role: "Bride", rating: 5, text: "x" },
      42,
    );
    expect(store.loadReviews()).toHaveLength(1);

    apiFetch.mockClear();
    const ok = store.removeReview(review!.id);
    expect(ok).toBe(true);
    expect(store.loadReviews()).toHaveLength(0);
    expect(apiFetch).toHaveBeenCalledWith(
      `/reviews/${encodeURIComponent(review!.id)}`,
      { method: "DELETE" },
    );
  });
});
