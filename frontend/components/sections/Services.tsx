"use client";

import { useT } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

export default function Services() {
  const t = useT();
  const s = t.services;

  return (
    <section
      id="services"
      style={{
        scrollMarginTop: 90,
        padding: "clamp(70px,9vw,140px) 0",
        background: "linear-gradient(180deg,#08040a,#0d0612 50%,#08040a)",
      }}
    >
      <div className="mx-auto w-[min(88%,1480px)]">
        <SectionHeading kicker={s.kicker} title={s.title} intro={s.intro} />

        {/* Wedding featured block */}
        <Reveal
          className="mt-[54px] rounded-[14px]"
          as="div"
        >
          <div
            style={{
              padding: "clamp(26px,3.5vw,48px)",
              background:
                "linear-gradient(160deg,rgba(28,14,8,.85),rgba(15,8,16,.85))",
              border: "1px solid rgba(231,178,76,.22)",
              boxShadow: "0 30px 70px rgba(0,0,0,.4)",
              borderRadius: 14,
            }}
          >
            <div className="flex flex-wrap items-baseline gap-4">
              <h3
                className="m-0 font-display font-semibold text-gold-300"
                style={{ fontSize: "clamp(26px,3vw,40px)" }}
              >
                💍 {s.wedding.title}
              </h3>
              <span className="font-body text-[15px] font-light text-sand-deep">
                {s.wedding.desc}
              </span>
            </div>

            <div
              className="mt-[34px] grid gap-[26px]"
              style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}
            >
              {s.wedding.groups.map((g) => (
                <div
                  key={g.title}
                  className="pt-[18px]"
                  style={{ borderTop: "1px solid rgba(231,178,76,.18)" }}
                >
                  <h4 className="mb-[14px] mt-0 text-[13px] uppercase tracking-[0.16em] text-gold-500">
                    {g.title}
                  </h4>
                  <div className="flex flex-col gap-[9px]">
                    {g.items.map((it) => (
                      <div key={it} className="flex items-center gap-[10px]">
                        <span
                          className="h-[5px] w-[5px] flex-none rounded-full"
                          style={{ background: "#c79a4e" }}
                        />
                        <span className="text-[14.5px] text-sand">{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-[30px] rounded-[10px] px-[22px] py-4 text-center text-[15px] text-gold-300"
              style={{
                background: "rgba(231,178,76,.07)",
                border: "1px solid rgba(231,178,76,.2)",
              }}
            >
              ✨ {s.wedding.note}
            </div>
          </div>
        </Reveal>

        {/* Other categories */}
        <div
          className="mt-6 grid gap-6"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}
        >
          {s.others.map((o, i) => (
            <Reveal key={o.title} delay={i * 0.06}>
              <div
                className="group h-full rounded-[14px] px-7 py-[30px] transition-[border-color,transform] duration-300 hover:-translate-y-1"
                style={{
                  background:
                    "linear-gradient(160deg,rgba(20,10,16,.8),rgba(12,7,14,.8))",
                  border: "1px solid rgba(231,178,76,.16)",
                }}
              >
                <h3 className="m-0 mb-[18px] font-display text-[26px] font-semibold text-gold-300">
                  {o.title}
                </h3>
                <div className="flex flex-col gap-[11px]">
                  {o.items.map((it) => (
                    <div key={it} className="flex items-center gap-[10px]">
                      <span className="text-gold-600">✦</span>
                      <span className="text-[15px] text-sand">{it}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
