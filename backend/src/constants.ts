/**
 * Default photo lists — mirror frontend/content/photos.ts. Used to seed the
 * PhotoGroup rows and to restore a group on "reset". Keep in sync with the
 * frontend defaults (the files live in frontend/public/photos, served at /photos).
 */
export type PhotoGroupId = "profile" | "showcase" | "gallery";

export const PHOTO_GROUP_IDS: PhotoGroupId[] = ["profile", "showcase", "gallery"];

export const PHOTO_DEFAULTS: Record<PhotoGroupId, string[]> = {
  profile: ["/photos/profile1.jpg", "/photos/profile2.jpg", "/photos/profile3.jpg"],
  showcase: [
    "/photos/wedding1.jpg",
    "/photos/wedding2.jpg",
    "/photos/wedding3.jpg",
    "/photos/wedding4.jpg",
    "/photos/wedding5.jpg",
    "/photos/torronto1.jpg",
    "/photos/torronto2.jpg",
  ],
  gallery: [
    "/photos/wedding1.jpg",
    "/photos/wedding2.jpg",
    "/photos/wedding3.jpg",
    "/photos/wedding4.jpg",
    "/photos/wedding5.jpg",
    "/photos/torronto1.jpg",
    "/photos/torronto2.jpg",
  ],
};

export function isPhotoGroup(v: string): v is PhotoGroupId {
  return (PHOTO_GROUP_IDS as string[]).includes(v);
}

export const LOCALES = ["ru", "ro", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v);
}

// --- Public free-text length caps (anti-abuse / storage-DoS; QA-3 QA3-3). ---
// Applied at the zod boundary on the public write endpoints. Generous enough for
// real input, tight enough to reject 100KB spray payloads.
export const MAX_NAME_LEN = 120;
export const MAX_PHONE_LEN = 40;
export const MAX_ROLE_LEN = 120;
export const MAX_MESSAGE_LEN = 4000;
export const MAX_REVIEW_TEXT_LEN = 4000;
