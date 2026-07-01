import { describe, it, expect } from "vitest";
import { SERVICES, TESTIMONIALS } from "../../src/content/catalogue";

const LOCALES = ["ru", "ro", "en"] as const;

describe("SERVICES catalogue", () => {
  it("has ru/ro/en keys", () => {
    expect(Object.keys(SERVICES).sort()).toEqual(["en", "ro", "ru"]);
  });

  it("every locale has wedding + others", () => {
    for (const locale of LOCALES) {
      const data = SERVICES[locale];
      expect(data.wedding).toBeDefined();
      expect(typeof data.wedding.title).toBe("string");
      expect(Array.isArray(data.wedding.groups)).toBe(true);
      expect(data.wedding.groups.length).toBeGreaterThan(0);
      expect(Array.isArray(data.others)).toBe(true);
      expect(data.others.length).toBeGreaterThan(0);
    }
  });
});

describe("TESTIMONIALS", () => {
  it("has ru/ro/en keys", () => {
    expect(Object.keys(TESTIMONIALS).sort()).toEqual(["en", "ro", "ru"]);
  });

  it("every locale is an array and any items use rev-<n> ids", () => {
    for (const locale of LOCALES) {
      const items = TESTIMONIALS[locale];
      expect(Array.isArray(items)).toBe(true);
      items.forEach((item, i) => {
        expect(item.id).toBe(`rev-${i + 1}`);
      });
    }
  });
});
