"use client";

import { useT } from "@/lib/i18n";
import Reveal from "@/components/ui/Reveal";
import Carousel from "@/components/ui/Carousel";
import { profilePhotos } from "@/content/photos";

export default function About() {
  const t = useT();
  const a = t.about;

  return (
    <section
      id="about"
      className="relative overflow-hidden"
      style={{ scrollMarginTop: 90, padding: "clamp(70px,9vw,140px) 0" }}
    >
      {/* accent glow */}
      <div
        className="pointer-events-none absolute left-[-10%] top-[-10%] h-[70%] w-[60%]"
        style={{
          background:
            "radial-gradient(circle,color-mix(in srgb,var(--bb-accent) 30%,transparent),transparent 65%)",
          filter: "blur(20px)",
        }}
      />
      <div className="relative mx-auto w-[min(88%,1480px)]">
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: "clamp(34px,5vw,70px)",
          }}
        >
          {/* text column */}
          <Reveal>
            <div className="mb-[18px] text-xs font-body uppercase tracking-[0.34em] text-gold-600">
              — {a.kicker}
            </div>
            <h2
              className="m-0 font-display font-semibold leading-[1.08]"
              style={{ fontSize: "clamp(30px,3.6vw,52px)", color: "#f3e6cb" }}
            >
              {a.title}
            </h2>
            <div
              className="mt-6 font-display italic leading-[1.4] text-gold-500"
              style={{ fontSize: "clamp(19px,2vw,26px)" }}
            >
              {a.name}
            </div>
            <div className="mt-1.5 text-[13px] font-body uppercase tracking-[0.14em] text-muted">
              {a.role}
            </div>
            <p className="mt-[22px] font-body text-[16px] font-light leading-[1.85] text-sand">
              {a.bio}
            </p>

            <div className="mt-[26px] flex flex-col gap-[13px]">
              {a.points.map((pt) => (
                <div key={pt} className="flex items-start gap-[13px]">
                  <span className="mt-[3px] text-[14px] text-gold-400">✦</span>
                  <span className="text-[15px]" style={{ color: "#ddccae" }}>
                    {pt}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-[30px] flex flex-wrap gap-[10px]">
              {a.badges.map((bd) => (
                <span
                  key={bd}
                  className="rounded-full px-4 py-[9px] text-[13px] text-gold-300"
                  style={{
                    border: "1px solid rgba(231,178,76,.26)",
                    background: "rgba(231,178,76,.05)",
                  }}
                >
                  {bd}
                </span>
              ))}
            </div>
          </Reveal>

          {/* image placeholder column */}
          <Reveal delay={0.05}>
            <div className="relative">
              <div
                className="relative overflow-hidden rounded-[8px]"
                style={{
                  aspectRatio: "4/5",
                  background:
                    "repeating-linear-gradient(135deg,#1a0c12,#1a0c12 11px,#21111a 11px,#21111a 22px)",
                  border: "1px solid rgba(231,178,76,.22)",
                  boxShadow: "0 30px 70px rgba(0,0,0,.55)",
                }}
              >
                <Carousel
                  images={profilePhotos}
                  alt={a.name}
                  sizes="(max-width:880px) 100vw, 40vw"
                  priority
                />
              </div>
              {/* quote card */}
              <div
                className="absolute bottom-[-26px] left-[-26px] max-w-[240px] rounded-[8px] px-6 py-[22px]"
                style={{
                  background: "linear-gradient(160deg,#1c0e08,#120a07)",
                  border: "1px solid rgba(231,178,76,.3)",
                  boxShadow: "0 20px 50px rgba(0,0,0,.6)",
                }}
              >
                <span className="font-display text-[18px] italic leading-[1.4] text-gold-300">
                  “{a.quote}”
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
