// Editable site photos — the single source for the About carousel, the
// Showcase strip, and the admin Photos section. Today these are static files
// in /public/photos; the admin can preview replacements in-session.

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

export interface PhotoGroup {
  id: PhotoGroupId;
  images: string[];
}

// BACKEND: replace with the real media list from the API/CMS. The admin Photos
// section consumes PhotoGroup[] and is otherwise untouched by the data source.
export async function getPhotoGroups(): Promise<PhotoGroup[]> {
  return [
    { id: "profile", images: profilePhotos },
    { id: "showcase", images: showcasePhotos },
  ];
}
