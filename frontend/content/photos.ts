// Default site photos — the static files in /public/photos. These are the
// starting images for the About carousel and the Showcase strip; the admin can
// replace them (persisted via lib/photoStore.ts) and the site updates live.

export type PhotoGroupId = "profile" | "showcase";

export const profilePhotos: string[] = [
  "/photos/profile1.jpg",
  "/photos/profile2.jpg",
  "/photos/profile3.jpg",
];

export const showcasePhotos: string[] = [
  "/photos/wedding1.jpg",
  "/photos/wedding2.jpg",
  "/photos/wedding3.jpg",
  "/photos/wedding4.jpg",
  "/photos/wedding5.jpg",
  "/photos/torronto1.jpg",
  "/photos/torronto2.jpg",
];

