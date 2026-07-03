import { describe, it, expect } from "vitest";
import { stripTags } from "../src/sanitize";

describe("stripTags", () => {
  it("removes an onerror image XSS payload entirely", () => {
    expect(stripTags("<img src=x onerror=alert(1)>")).toBe("");
  });

  it("unwraps formatting tags, keeping their text", () => {
    expect(stripTags("<b>bold</b>")).toBe("bold");
    expect(stripTags("<script>alert(1)</script>")).toBe("alert(1)");
  });

  it("collapses malformed / nested tag payloads", () => {
    expect(stripTags("<<b>b>x")).toBe("x");
  });

  it("keeps a lone < / > used as math or punctuation", () => {
    expect(stripTags("5 < 10 guests")).toBe("5 < 10 guests");
  });

  it("leaves clean text (incl. non-latin + emoji) untouched", () => {
    expect(stripTags("Красивое оформление 👍")).toBe("Красивое оформление 👍");
  });
});
