"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, RotateCcw } from "lucide-react";
import { useT } from "@/lib/i18n";
import { type PhotoGroupId } from "@/content/photos";
import {
  fileToScaledDataUrl,
  loadGroup,
  replacePhoto,
  resetGroup,
  subscribe,
} from "@/lib/photoStore";

interface Group {
  id: PhotoGroupId;
  images: string[];
}

const GROUP_IDS: PhotoGroupId[] = ["profile", "showcase"];

/**
 * Admin "Photos" section. Replacements are saved to the shared photo store and
 * show up on the public site immediately (About carousel + Showcase strip).
 * BACKEND: replacePhoto currently persists a downscaled data URL in
 * localStorage; swap it for a real upload + media URL.
 */
export default function PhotosSection() {
  const t = useT();
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const target = useRef<{ id: PhotoGroupId; index: number } | null>(null);

  // Mirror the shared store so the admin sees the same images as the site.
  useEffect(() => {
    const refresh = () =>
      setGroups(GROUP_IDS.map((id) => ({ id, images: loadGroup(id) })));
    refresh();
    return subscribe(refresh);
  }, []);

  const groupLabel = (id: PhotoGroupId) =>
    id === "profile" ? t.admin.photos.profile : t.admin.photos.showcase;

  const pick = (id: PhotoGroupId, index: number) => {
    target.current = { id, index };
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const tgt = target.current;
    e.target.value = ""; // allow re-picking the same file
    target.current = null;
    if (!file || !tgt) return;
    setError(false);
    try {
      // BACKEND: upload `file` and store the returned URL instead of a data URL.
      const dataUrl = await fileToScaledDataUrl(file);
      if (!replacePhoto(tgt.id, tgt.index, dataUrl)) setError(true);
    } catch {
      setError(true);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-[clamp(16px,3vw,32px)] py-7">
      <div className="mx-auto max-w-[1100px]">
        <h2 className="m-0 font-display text-[28px] font-semibold text-gold-300">
          {t.admin.photos.title}
        </h2>
        <p className="mt-1 text-[14px] text-sand-deep">{t.admin.photos.intro}</p>

        {/* mode notice */}
        <div
          className="mt-4 rounded-[10px] px-4 py-3 text-[13px] text-gold-300"
          style={{ background: "rgba(231,178,76,.08)", border: "1px solid rgba(231,178,76,.22)" }}
        >
          ⓘ {t.admin.photos.note}
        </div>

        {error ? (
          <div
            className="mt-3 rounded-[10px] px-4 py-3 text-[13px]"
            style={{ background: "rgba(209,58,90,.12)", border: "1px solid rgba(209,58,90,.4)", color: "#f0a5b5" }}
          >
            {t.admin.photos.saveError}
          </div>
        ) : null}

        {groups.map((grp) => (
          <section key={grp.id} className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-[13px] uppercase tracking-[0.16em] text-gold-500">
                {groupLabel(grp.id)}
              </h3>
              <button
                onClick={() => resetGroup(grp.id)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] text-sand"
                style={{ border: "1px solid rgba(231,178,76,.2)", background: "transparent" }}
              >
                <RotateCcw size={13} /> {t.admin.photos.reset}
              </button>
            </div>
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
                    onClick={() => pick(grp.id, ii)}
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
