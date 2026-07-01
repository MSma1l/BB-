import { describe, it, expect, beforeEach, vi } from "vitest";
import { profilePhotos } from "@/content/photos";

const apiFetch = vi.fn();
const apiJson = vi.fn();
const sse = vi.fn(() => () => {});

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
  apiJson: (...args: unknown[]) => apiJson(...args),
  sse: (...args: unknown[]) => sse(...args),
}));

type Store = typeof import("@/lib/photoStore");

async function freshStore(): Promise<Store> {
  vi.resetModules();
  return import("@/lib/photoStore");
}

const okResponse = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

beforeEach(() => {
  apiFetch.mockReset();
  apiJson.mockReset();
  apiFetch.mockResolvedValue(okResponse([]));
});

describe("photoStore", () => {
  it("loadGroup returns the built-in defaults before hydration", async () => {
    const store = await freshStore();
    expect(store.loadGroup("profile")).toEqual(profilePhotos);
    // returns a copy, not the module's default array reference
    expect(store.loadGroup("profile")).not.toBe(profilePhotos);
  });

  it("saveGroup optimistically replaces the cache and PUTs the list", async () => {
    const store = await freshStore();
    const next = ["/photos/a.jpg", "/photos/b.jpg"];
    const ok = store.saveGroup("gallery", next);
    expect(ok).toBe(true);
    expect(store.loadGroup("gallery")).toEqual(next);
    expect(apiFetch).toHaveBeenCalledWith("/photos/gallery", {
      method: "PUT",
      json: { images: next },
    });
  });

  it("addPhoto appends to the current list and persists", async () => {
    const store = await freshStore();
    store.addPhoto("profile", "/photos/new.jpg");
    expect(store.loadGroup("profile")).toEqual([
      ...profilePhotos,
      "/photos/new.jpg",
    ]);
    expect(apiFetch).toHaveBeenLastCalledWith("/photos/profile", {
      method: "PUT",
      json: { images: [...profilePhotos, "/photos/new.jpg"] },
    });
  });

  it("removePhoto drops the image at an index", async () => {
    const store = await freshStore();
    store.removePhoto("profile", 0);
    expect(store.loadGroup("profile")).toEqual(profilePhotos.slice(1));
  });

  it("replacePhoto swaps a single image", async () => {
    const store = await freshStore();
    store.replacePhoto("profile", 1, "/photos/swapped.jpg");
    const out = store.loadGroup("profile");
    expect(out[1]).toBe("/photos/swapped.jpg");
    expect(out[0]).toBe(profilePhotos[0]);
  });
});
