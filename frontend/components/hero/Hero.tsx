"use client";

import { Phone, MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useUI } from "@/lib/ui";

const PHONE = "+37360000000";

export default function Hero() {
  const t = useT();
  const { openChat, triggerBurst } = useUI();

  // The sky + balloons are now the global site background (SiteBackground).
  // The hero just keeps the click-to-burst interaction.
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    triggerBurst(e.clientX, e.clientY);
  };

  return (
    <section
      onClick={handleClick}
      className="relative flex cursor-pointer items-center overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
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
