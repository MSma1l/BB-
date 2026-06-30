"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useT } from "@/lib/i18n";
import { profilePhotos, showcasePhotos, type PhotoGroupId } from "@/content/photos";

interface Group {
  id: PhotoGroupId;
  images: string[];
}

/**
 * Admin "Photos" section. Lets the admin preview replacement images for the
 * site's photo groups. DEMO: replacements are in-session object URLs only.
 * BACKEND: upload the chosen file and persist it via the media API/CMS.
 */
export default function PhotosSection() {
  const t = useT();
  const [groups, setGroups] = useState<Group[]>(() => [
    { id: "profile", images: [...profilePhotos] },
    { id: "showcase", images: [...showcasePhotos] },
  ]);
  const fileRef = useRef<HTMLInputElement>(null);
  const target = useRef<{ g: number; i: number } | null>(null);

  const groupLabel = (id: PhotoGroupId) =>
    id === "profile" ? t.admin.photos.profile : t.admin.photos.showcase;

  const pick = (g: number, i: number) => {
    target.current = { g, i };
    fileRef.current?.click();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const tgt = target.current;
    if (file && tgt) {
      const url = URL.createObjectURL(file); // BACKEND: upload instead.
      setGroups((prev) =>
        prev.map((grp, gi) =>
          gi === tgt.g
            ? { ...grp, images: grp.images.map((im, ii) => (ii === tgt.i ? url : im)) }
            : grp,
        ),
      );
    }
    e.target.value = ""; // allow re-picking the same file
    target.current = null;
  };

  return (
    <div className="h-full overflow-y-auto px-[clamp(16px,3vw,32px)] py-7">
      <div className="mx-auto max-w-[1100px]">
        <h2 className="m-0 font-display text-[28px] font-semibold text-gold-300">
          {t.admin.photos.title}
        </h2>
        <p className="mt-1 text-[14px] text-sand-deep">{t.admin.photos.intro}</p>

        {/* demo-mode notice */}
        <div
          className="mt-4 rounded-[10px] px-4 py-3 text-[13px] text-gold-300"
          style={{ background: "rgba(231,178,76,.08)", border: "1px solid rgba(231,178,76,.22)" }}
        >
          ⚠ {t.admin.photos.note}
        </div>

        {groups.map((grp, gi) => (
          <section key={grp.id} className="mt-8">
            <h3 className="mb-3 text-[13px] uppercase tracking-[0.16em] text-gold-500">
              {groupLabel(grp.id)}
            </h3>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))" }}
            >
              {grp.images.map((src, ii) => (
                <div
                  key={`${grp.id}-${ii}`}
                  className="overflow-hidden rounded-[12px]"
                  style={{ border: "1px solid rgba(231,178,76,.18)", background: "#140a10" }}
                >
                  <div className="relative aspect-[3/4] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${groupLabel(grp.id)} ${ii + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => pick(gi, ii)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 border-none py-[10px] text-[12.5px] font-medium text-gold-200"
                    style={{ background: "rgba(231,178,76,.07)" }}
                  >
                    <Upload size={14} /> {t.admin.photos.replace}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="hidden"
        />
      </div>
    </div>
  );
}
