import { describe, it, expect } from "vitest";
import { mergeDictionary } from "@/lib/contentStore";
import { getDictionary } from "@/content/i18n";
import type { Dictionary } from "@/lib/types";

describe("mergeDictionary", () => {
  it("returns base unchanged (same reference) when overrides are empty", () => {
    const base = getDictionary("ru");
    expect(mergeDictionary(base, {})).toBe(base);
  });

  it("applies a simple dot-path override", () => {
    const base = getDictionary("ru");
    const out = mergeDictionary(base, { "hero.titleA": "NEW TITLE" });
    expect(out.hero.titleA).toBe("NEW TITLE");
    // other fields untouched
    expect(out.hero.titleB).toBe(base.hero.titleB);
  });

  it("applies an array-index path", () => {
    const base = getDictionary("ru");
    const out = mergeDictionary(base, { "about.points.0": "Overridden point" });
    expect(out.about.points[0]).toBe("Overridden point");
    expect(out.about.points[1]).toBe(base.about.points[1]);
  });

  it("ignores a stale/invalid path without throwing", () => {
    const base = getDictionary("ru");
    expect(() =>
      mergeDictionary(base, {
        "hero.does.not.exist": "x",
        "totally.bogus.path": "y",
      }),
    ).not.toThrow();
    const out = mergeDictionary(base, { "nope.missing": "z" });
    // nothing added at top level for a bogus root
    expect((out as unknown as Record<string, unknown>)["nope"]).toBeUndefined();
  });

  it("does not mutate the original base", () => {
    const base = getDictionary("ru");
    const originalTitle = base.hero.titleA;
    const originalPoint = base.about.points[0];
    mergeDictionary(base, {
      "hero.titleA": "MUTATED?",
      "about.points.0": "MUTATED?",
    });
    expect(base.hero.titleA).toBe(originalTitle);
    expect(base.about.points[0]).toBe(originalPoint);
  });

  it("works with a minimal fake Dictionary-shaped object", () => {
    const fake = {
      hero: { titleA: "a", titleB: "b" },
      about: { points: ["p0", "p1"] },
    } as unknown as Dictionary;
    const out = mergeDictionary(fake, {
      "hero.titleA": "A!",
      "about.points.1": "P1!",
    });
    expect(out.hero.titleA).toBe("A!");
    expect(out.about.points[1]).toBe("P1!");
    // original untouched
    expect(fake.hero.titleA).toBe("a");
  });
});
