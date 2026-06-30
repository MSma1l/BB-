"use client";

import Image from "next/image";
import { Phone, MessageCircle, Mail, MapPin, Lock } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useUI } from "@/lib/ui";

const PHONE = "+37360000000";

export default function Footer() {
  const t = useT();
  const f = t.footer;
  const { openChat, openAdmin } = useUI();

  return (
    <footer
      className="relative overflow-hidden"
      style={{ padding: "clamp(70px,9vw,130px) 0 50px" }}
    >
      {/* gentle top fade to separate the footer from the section above; the
          sky + balloons (global background) show through the rest */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[220px]"
        style={{
          background: "linear-gradient(180deg,rgba(8,4,10,.6),transparent)",
        }}
      />
      <div className="relative mx-auto w-[min(88%,1100px)] text-center">
        <div className="mb-4 text-xs font-body uppercase tracking-[0.34em] text-gold-600">
          — {f.kicker}
        </div>
        <h2
          className="mx-auto m-0 max-w-[20ch] font-display font-semibold leading-[1.12]"
          style={{ fontSize: "clamp(28px,3.8vw,52px)", color: "#f3e6cb" }}
        >
          {f.title}
        </h2>

        <div className="mt-[38px] flex flex-wrap justify-center gap-4">
          <a
            href={`tel:${PHONE}`}
            className="inline-flex items-center gap-[11px] rounded-full px-[34px] py-[17px] text-[15px] font-semibold no-underline bb-gold-btn"
          >
            <Phone size={16} /> {f.phone}
          </a>
          <button
            onClick={openChat}
            className="inline-flex cursor-pointer items-center gap-[11px] rounded-full px-[34px] py-[17px] text-[15px] font-medium text-gold-200"
            style={{
              border: "1px solid rgba(231,178,76,.55)",
              background: "rgba(231,178,76,.07)",
            }}
          >
            <MessageCircle size={16} /> {t.hero.quote}
          </button>
        </div>

        <div className="mt-[34px] flex flex-wrap justify-center gap-[26px] text-[14px] text-sand-deep">
          <a
            href={`mailto:${f.email}`}
            className="inline-flex items-center gap-2 text-sand no-underline"
          >
            <Mail size={15} /> {f.email}
          </a>
          <span className="inline-flex items-center gap-2">
            <MapPin size={15} /> {f.cityLabel}
          </span>
        </div>

        <div className="mt-[54px] flex items-center justify-center gap-[13px]">
          <Image
            src="/assets/logo-bb.jpg"
            alt="Balloons Breeze"
            width={54}
            height={54}
            className="h-[54px] w-[54px] rounded-full object-cover"
            style={{ mixBlendMode: "screen" }}
          />
          <span className="font-display text-[22px] uppercase tracking-[0.2em] text-gold-500">
            Balloons Breeze
          </span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-[18px] text-[12px] text-dim">
          <span>
            © 2026 {f.brandLine}. {f.rights}.
          </span>
          <button
            onClick={openAdmin}
            className="inline-flex cursor-pointer items-center gap-[5px] border-none bg-transparent text-[12px] text-dim transition-colors hover:text-gold-600"
          >
            <Lock size={12} /> {f.admin}
          </button>
        </div>
      </div>
    </footer>
  );
}
