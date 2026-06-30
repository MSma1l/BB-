"use client";

import { useT } from "@/lib/i18n";
import Reveal from "@/components/ui/Reveal";
import Carousel from "@/components/ui/Carousel";

const SHOWCASE_PHOTOS = [
  "/photos/wedding1.jpg",
  "/photos/wedding2.jpg",
  "/photos/wedding3.jpg",
  "/photos/wedding4.jpg",
  "/photos/wedding5.jpg",
  "/photos/torronto1.jpg",
  "/photos/torronto2.jpg",
];

/** Wide image strip between About and Services (2nd placeholder zone). */
export default function Showcase() {
  const t = useT();
  return (
    <section className="relative" style={{ padding: "clamp(50px,7vw,100px) 0" }}>
      <div className="mx-auto w-[min(88%,1480px)]">
        <Reveal
          className="relative overflow-hidden rounded-[10px]"
          as="div"
        >
          <div
            className="relative"
            style={{
              aspectRatio: "21/8",
              minHeight: 240,
              background:
                "repeating-linear-gradient(135deg,#15080d,#15080d 13px,#1d0e16 13px,#1d0e16 26px)",
              border: "1px solid rgba(231,178,76,.2)",
              boxShadow: "0 30px 80px rgba(0,0,0,.5)",
            }}
          >
            <Carousel
              images={SHOWCASE_PHOTOS}
              alt={t.about.imgB}
              sizes="(max-width:1480px) 88vw, 1480px"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
