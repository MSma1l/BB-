"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Phone, MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useUI } from "@/lib/ui";
import type { BurstSignal } from "@/components/hero/Balloons3D";

// WebGL must not render on the server.
const Balloons3D = dynamic(() => import("@/components/hero/Balloons3D"), {
  ssr: false,
});

const PHONE = "+37360000000";

export default function Hero() {
  const t = useT();
  const { openChat } = useUI();
  const burstRef = useRef<BurstSignal>({ x: 0.5, y: 0.5, n: 0 });
  const nebulaRef = useRef<HTMLDivElement>(null);

  // Subtle nebula parallax on scroll (matches the prototype).
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (nebulaRef.current) {
        nebulaRef.current.style.transform = `translateY(${y * 0.28}px) scale(1.08)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    burstRef.current = {
      x: (e.clientX - r.left) / Math.max(1, r.width),
      y: (e.clientY - r.top) / Math.max(1, r.height),
      n: burstRef.current.n + 1,
    };
  };

  return (
    <section
      onClick={handleClick}
      className="relative flex cursor-pointer items-center overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
      <div
        ref={nebulaRef}
        className="pointer-events-none absolute"
        style={{
          inset: "-6%",
          background: "url('/assets/nebula-bg.jpg') center/cover no-repeat",
          willChange: "transform",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 42%,rgba(8,4,10,.05),rgba(8,4,10,.74) 66%,#08040a)",
        }}
      />

      <Balloons3D burstRef={burstRef} />

      <div className="relative z-[2] mx-auto w-[min(88%,1180px)] py-[120px] pb-[90px] text-center">
        <div
          className="mb-[30px] inline-flex items-center gap-[10px] rounded-full px-5 py-[9px]"
          style={{
            border: "1px solid rgba(231,178,76,.34)",
            background: "rgba(20,8,14,.35)",
            backdropFilter: "blur(4px)",
          }}
        >
          <span
            className="h-[7px] w-[7px] rounded-full"
            style={{ background: "#e7b24c", boxShadow: "0 0 10px #e7b24c" }}
          />
          <span className="text-[12px] uppercase tracking-[0.32em] text-gold-300">
            Corporation Balloons Breeze
          </span>
        </div>

        <h1
          className="m-0 mx-auto font-display font-semibold leading-[1.02]"
          style={{ letterSpacing: "0.01em" }}
        >
          <span
            className="block font-medium"
            style={{ fontSize: "clamp(30px,4.6vw,60px)", color: "#efe2c6" }}
          >
            {t.hero.titleA}
          </span>
          <span
            className="block bb-gold-text"
            style={{
              fontSize: "clamp(34px,5.4vw,74px)",
              textShadow: "0 2px 46px rgba(231,178,76,.22)",
            }}
          >
            {t.hero.titleB}
          </span>
        </h1>

        <p
          className="mx-auto mt-[22px] max-w-[26ch] font-display italic leading-[1.36] text-gold-300"
          style={{ fontSize: "clamp(18px,2.2vw,28px)" }}
        >
          {t.hero.tagline}
        </p>
        <p
          className="mx-auto mt-5 max-w-[48ch] font-light tracking-[0.14em] text-sand-deep"
          style={{ fontSize: "clamp(12px,1.25vw,15px)" }}
        >
          {t.hero.sub}
        </p>

        <div className="mt-[42px] flex flex-wrap justify-center gap-4">
          <a
            href={`tel:${PHONE}`}
            className="inline-flex items-center gap-[11px] rounded-full px-[34px] py-[17px] text-[15px] font-semibold tracking-[0.03em] no-underline bb-gold-btn"
          >
            <Phone size={16} /> {t.hero.call}
          </a>
          <button
            onClick={openChat}
            className="inline-flex cursor-pointer items-center gap-[11px] rounded-full px-[34px] py-[17px] text-[15px] font-medium text-gold-200"
            style={{
              border: "1px solid rgba(231,178,76,.55)",
              background: "rgba(231,178,76,.07)",
              backdropFilter: "blur(4px)",
            }}
          >
            <MessageCircle size={16} /> {t.hero.quote}
          </button>
        </div>

        <div className="mt-[26px] flex items-center justify-center gap-[9px] text-[11px] uppercase tracking-[0.2em] text-muted">
          <span className="text-[13px] text-gold-400">✦</span>
          {t.hero.hint}
        </div>
      </div>

      <div className="absolute bottom-[26px] left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted">
          {t.hero.scroll}
        </span>
        <span
          className="text-[18px] text-gold-400"
          style={{ animation: "bbBob 1.8s ease-in-out infinite" }}
        >
          ↓
        </span>
      </div>
    </section>
  );
}
