"use client";

import { useT } from "@/lib/i18n";
import Reveal from "@/components/ui/Reveal";
import Carousel from "@/components/ui/Carousel";
import { useSitePhotos } from "@/lib/photoStore";

/**
 * Dynamic photo mosaic between About and Services. A bento grid of differently
 * sized tiles, each cross-fading through the showcase photo pool from a
 * staggered start index + interval — so the whole zone looks alive ("rotating"),
 * compact on mobile, spacious on desktop.
 */

// span classes (mobile 2-col → desktop 4-col) + de-sync offsets per tile.
const TILES = [
  { cls: "col-span-2 row-span-2", start: 0, ms: 2600 },
  { cls: "col-span-2 row-span-1", start: 3, ms: 3200 },
  { cls: "col-span-1 row-span-1", start: 1, ms: 2900 },
  { cls: "col-span-1 row-span-1", start: 4, ms: 3500 },
  { cls: "col-span-2 row-span-1", start: 2, ms: 3000 },
  { cls: "col-span-1 md:col-span-2 row-span-1", start: 5, ms: 3300 },
];

export default function Showcase() {
  const t = useT();
  const photos = useSitePhotos("showcase");

  return (
    <section className="relative" style={{ padding: "clamp(28px,7vw,100px) 0" }}>
      <div className="mx-auto w-[min(88%,1480px)]">
        <Reveal as="div">
          <div
            className="grid grid-flow-row-dense grid-cols-2 gap-2.5 [grid-auto-rows:118px] md:grid-cols-4 md:gap-4 md:[grid-auto-rows:152px]"
          >
            {TILES.map((tile, i) => (
              <div
                key={i}
                className={`group relative overflow-hidden rounded-[10px] ${tile.cls}`}
                style={{
                  background:
                    "repeating-linear-gradient(135deg,#15080d,#15080d 13px,#1d0e16 13px,#1d0e16 26px)",
                  border: "1px solid rgba(231,178,76,.2)",
                  boxShadow: "0 18px 50px rgba(0,0,0,.4)",
                }}
              >
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.06]">
                  <Carousel
                    images={photos}
                    alt={t.about.imgB}
                    startIndex={tile.start}
                    intervalMs={tile.ms}
                    sizes="(max-width:768px) 45vw, 25vw"
                  />
                </div>
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg,transparent 60%,rgba(8,4,10,.35))",
                  }}
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
