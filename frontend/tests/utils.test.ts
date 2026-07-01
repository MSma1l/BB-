import { describe, it, expect } from "vitest";
import { cn, formatTime, pad2, initials } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy fragments with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });
  it("drops falsy fragments", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });
  it("returns an empty string with no truthy parts", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

describe("pad2", () => {
  it("zero-pads single digits", () => {
    expect(pad2(7)).toBe("07");
    expect(pad2(0)).toBe("00");
  });
  it("leaves two-plus digit numbers unchanged", () => {
    expect(pad2(12)).toBe("12");
    expect(pad2(123)).toBe("123");
  });
});

describe("formatTime", () => {
  it("formats an epoch-ms timestamp as HH:MM in local time", () => {
    // Build a timestamp from local-time components so the assertion is
    // timezone-independent.
    const d = new Date(2023, 0, 2, 9, 5, 30);
    expect(formatTime(d.getTime())).toBe("09:05");
  });
  it("zero-pads both hours and minutes", () => {
    const d = new Date(2023, 0, 2, 3, 7);
    expect(formatTime(d.getTime())).toBe("03:07");
  });
  it("handles midnight and end-of-day", () => {
    expect(formatTime(new Date(2023, 0, 1, 0, 0).getTime())).toBe("00:00");
    expect(formatTime(new Date(2023, 0, 1, 23, 59).getTime())).toBe("23:59");
  });
});

describe("initials", () => {
  it("takes up to two uppercase initials", () => {
    expect(initials("Elena & Andrei")).toBe("EA");
  });
  it("splits on spaces and middots too", () => {
    expect(initials("Ana Maria Popescu")).toBe("AM");
    expect(initials("Ion·Vasile")).toBe("IV");
  });
  it("uppercases a single name's first letter", () => {
    expect(initials("elena")).toBe("E");
  });
  it("returns empty string for empty/blank input", () => {
    expect(initials("")).toBe("");
    expect(initials("   ")).toBe("");
  });
});
