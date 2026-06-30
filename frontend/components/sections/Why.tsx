"use client";

import { useT } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

export default function Why() {
  const t = useT();
  const w = t.why;

  return (
    <section id="why" style={{ scrollMarginTop: 90, padding: "clamp(70px,9vw,140px) 0" }}>
      <div className="mx-auto w-[min(88%,1480px)]">
        <SectionHeading kicker={w.kicker} title={w.title} />
        <div
          className="mt-[46px] grid gap-[18px]"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}
        >
          {w.items.map((item, i) => (
            <Reveal key={item} delay={i * 0.05}>
              <div
                className="flex items-center gap-4 rounded-[12px] px-[26px] py-6"
                style={{
                  background:
                    "linear-gradient(160deg,rgba(22,11,17,.8),rgba(12,7,14,.8))",
                  border: "1px solid rgba(231,178,76,.16)",
                }}
              >
                <span
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-bold bb-gold-btn"
                  style={{ boxShadow: "none" }}
                >
                  ✓
                </span>
                <span className="text-[16px]" style={{ color: "#e3d4b6" }}>
                  {item}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
