"use client";

import { useT } from "@/lib/i18n";
import Reveal from "@/components/ui/Reveal";

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
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--bb-accent) 22%,transparent),transparent 70%)",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="text-[40px] opacity-50">🎈</span>
              <span className="font-body text-[12px] tracking-[0.18em] text-muted">
                {t.about.imgB}
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
