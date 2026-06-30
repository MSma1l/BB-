"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n";
import { pad2, cn } from "@/lib/utils";
import { galleryItems, categoryMeta, galleryFilters } from "@/content/gallery";
import type { GalleryCategory } from "@/lib/types";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import Lightbox from "@/components/ui/Lightbox";

type Filter = "all" | GalleryCategory;

export default function Gallery() {
  const t = useT();
  const cats = t.gallery.cats;
  const [filter, setFilter] = useState<Filter>("all");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? galleryItems
        : galleryItems.filter((g) => g.category === filter),
    [filter],
  );

  const slides = filtered.map((g) => ({
    bg: categoryMeta[g.category].bg,
    icon: categoryMeta[g.category].icon,
    label: cats[g.category],
  }));

  const count = slides.length;

  return (
    <section
      id="gallery"
      style={{ scrollMarginTop: 90, padding: "clamp(70px,9vw,140px) 0" }}
    >
      <div className="mx-auto w-[min(88%,1480px)]">
        <SectionHeading kicker={t.gallery.kicker} title={t.gallery.title} />

        {/* filter chips */}
        <div className="mt-[34px] flex flex-wrap justify-center gap-[10px]">
          {galleryFilters.map((k) => {
            const active = filter === k;
            return (
              <button
                key={k}
                onClick={() => {
                  setFilter(k);
                  setLightbox(null);
                }}
                className={cn(
                  "cursor-pointer rounded-full px-5 py-[10px] text-[13.5px] tracking-[0.03em] transition-all duration-200",
                  active ? "text-gold-200" : "text-sand-deep",
                )}
                style={
                  active
                    ? {
                        border: "1px solid rgba(231,178,76,.6)",
                        background:
                          "linear-gradient(180deg,rgba(251,231,168,.16),rgba(189,138,46,.1))",
                      }
                    : {
                        border: "1px solid rgba(231,178,76,.2)",
                        background: "transparent",
                      }
                }
              >
                {cats[k]}
              </button>
            );
          })}
        </div>

        {/* grid */}
        <div
          className="mt-[30px] grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}
        >
          {filtered.map((g, pos) => {
            const meta = categoryMeta[g.category];
            return (
              <Reveal key={g.id} delay={(pos % 4) * 0.05}>
                <button
                  onClick={() => setLightbox(pos)}
                  className="group relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[10px] transition-transform duration-300 hover:-translate-y-1"
                  style={{
                    border: "1px solid rgba(231,178,76,.16)",
                    background: meta.bg,
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--bb-accent) 18%,transparent),transparent 72%)",
                    }}
                  />
                  <div
                    className="absolute left-4 top-[14px] font-display text-[30px]"
                    style={{ color: "rgba(231,178,76,.4)" }}
                  >
                    {pad2(pos + 1)}
                  </div>
                  <div className="relative flex flex-col items-center gap-[9px]">
                    <span className="text-[30px] opacity-55">{meta.icon}</span>
                    <span className="font-body text-[11px] tracking-[0.14em] text-muted">
                      {cats[g.category]}
                    </span>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      <Lightbox
        slides={slides}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onPrev={() => setLightbox((i) => (i === null ? i : (i - 1 + count) % count))}
        onNext={() => setLightbox((i) => (i === null ? i : (i + 1) % count))}
      />
    </section>
  );
}
