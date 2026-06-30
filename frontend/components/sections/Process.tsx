"use client";

import { useT } from "@/lib/i18n";
import { pad2 } from "@/lib/utils";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

const STEP_ICONS = ["📞", "🎨", "💬", "🎈", "✨"];

export default function Process() {
  const t = useT();
  const p = t.process;

  return (
    <section
      id="process"
      style={{
        scrollMarginTop: 90,
        padding: "clamp(70px,9vw,140px) 0",
        background: "linear-gradient(180deg,#08040a,#100614 50%,#08040a)",
      }}
    >
      <div className="mx-auto w-[min(88%,1480px)]">
        <SectionHeading kicker={p.kicker} title={p.title} />
        <div
          className="mt-[50px] grid gap-[18px]"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}
        >
          {p.steps.map((title, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div
                className="relative rounded-[12px] px-[22px] py-[30px] text-center"
                style={{
                  background:
                    "linear-gradient(160deg,rgba(22,11,17,.8),rgba(12,7,14,.8))",
                  border: "1px solid rgba(231,178,76,.16)",
                }}
              >
                <div
                  className="font-display font-semibold bb-gold-text"
                  style={{ fontSize: 46 }}
                >
                  {pad2(i + 1)}
                </div>
                <div className="my-2 text-[24px]">{STEP_ICONS[i]}</div>
                <div
                  className="text-[15px] leading-[1.4]"
                  style={{ color: "#ddccae" }}
                >
                  {title}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
