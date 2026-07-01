import { describe, it, expect } from "vitest";
import {
  isPhotoGroup,
  isLocale,
  PHOTO_DEFAULTS,
  PHOTO_GROUP_IDS,
  LOCALES,
} from "../src/constants";

describe("constants", () => {
  it("isPhotoGroup is truthy only for known groups", () => {
    expect(isPhotoGroup("profile")).toBe(true);
    expect(isPhotoGroup("showcase")).toBe(true);
    expect(isPhotoGroup("gallery")).toBe(true);
    expect(isPhotoGroup("nope")).toBe(false);
    expect(isPhotoGroup("")).toBe(false);
  });

  it("isLocale is truthy only for known locales", () => {
    expect(isLocale("ru")).toBe(true);
    expect(isLocale("ro")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale("")).toBe(false);
  });

  it("PHOTO_GROUP_IDS is exactly the three groups", () => {
    expect(PHOTO_GROUP_IDS).toEqual(["profile", "showcase", "gallery"]);
  });

  it("LOCALES is exactly ru/ro/en", () => {
    expect([...LOCALES]).toEqual(["ru", "ro", "en"]);
  });

  it("PHOTO_DEFAULTS has all 3 groups with non-empty arrays", () => {
    for (const group of PHOTO_GROUP_IDS) {
      expect(Array.isArray(PHOTO_DEFAULTS[group])).toBe(true);
      expect(PHOTO_DEFAULTS[group].length).toBeGreaterThan(0);
      for (const url of PHOTO_DEFAULTS[group]) {
        expect(typeof url).toBe("string");
        expect(url.length).toBeGreaterThan(0);
      }
    }
  });
});
