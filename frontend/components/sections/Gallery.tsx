"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { pad2 } from "@/lib/utils";
import { useSitePhotos } from "@/lib/photoStore";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import Lightbox from "@/components/ui/Lightbox";

/** Portfolio grid of real event photos (managed from the admin Photos section). */
export default function Gallery() {
  const t = useT();
  const images = useSitePhotos("gallery");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const slides = images.map((src) => ({ src, label: t.gallery.title }));
  const count = images.length;

  return (
    <section
      id="gallery"
      style={{ scrollMarginTop: 90, padding: "clamp(38px,9vw,140px) 0" }}
    >
      <div className="mx-auto w-[min(88%,1480px)]">
        <SectionHeading kicker={t.gallery.kicker} title={t.gallery.title} />

        {/* grid */}
        <div
          className="mt-7 md:mt-[40px] grid gap-3 md:gap-4 grid-cols-2 md:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]"
        >
          {images.map((src, pos) => (
            <Reveal key={`${src}-${pos}`} delay={(pos % 4) * 0.05}>
              <button
                onClick={() => setLightbox(pos)}
                className="group relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[10px] transition-transform duration-300 hover:-translate-y-1"
                style={{ border: "1px solid rgba(231,178,76,.16)", background: "#140a10" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${t.gallery.title} ${pos + 1}`}
                  // Defer off-screen portfolio images so mobile (3G) doesn't
                  // fetch the whole grid up front (QA-1 MOB-2).
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg,transparent 55%,rgba(8,4,10,.55))",
                  }}
                />
                <div
                  className="absolute left-4 top-[12px] font-display text-[30px]"
                  style={{ color: "rgba(255,255,255,.55)", textShadow: "0 2px 8px rgba(0,0,0,.6)" }}
                >
                  {pad2(pos + 1)}
                </div>
              </button>
            </Reveal>
          ))}
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
