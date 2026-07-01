"use client";

import { useState } from "react";
import Image from "next/image";
import { Phone, Menu, X } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import LangSwitch from "@/components/ui/LangSwitch";

const PHONE = "+37376616384";

export default function Nav() {
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "#about", label: t.nav.about },
    { href: "#services", label: t.nav.services },
    { href: "#gallery", label: t.nav.gallery },
    { href: "#process", label: t.nav.process },
    { href: "#why", label: t.nav.why },
    { href: "#reviews", label: t.nav.reviews },
  ];

  return (
    <>
      <nav
        className="fixed inset-x-0 top-0 z-50"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background:
            "linear-gradient(180deg,rgba(8,4,10,.9),rgba(8,4,10,.45))",
          borderBottom: "1px solid rgba(231,178,76,.14)",
        }}
      >
        <div className="mx-auto flex h-[66px] w-[90%] items-center justify-between gap-6 md:h-20 md:w-[min(88%,1480px)]">
          <a href="#top" className="flex items-center gap-[13px] no-underline">
            <Image
              src="/assets/logo-bb.jpg"
              alt="Balloons Breeze"
              width={48}
              height={48}
              className="h-10 w-10 rounded-full object-cover md:h-12 md:w-12"
              style={{ mixBlendMode: "screen" }}
            />
            <span className="whitespace-nowrap font-display font-semibold uppercase text-gold-200 text-[15px] tracking-[0.1em] md:text-[22px] md:tracking-[0.2em]">
              Balloons Breeze
            </span>
          </a>

          {/* desktop links */}
          <div className="hidden items-center gap-[30px] md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[14px] tracking-[0.04em] text-sand no-underline transition-colors duration-200 hover:text-gold-200"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <LangSwitch />
            <a
              href={`tel:${PHONE}`}
              className="inline-flex items-center gap-[9px] rounded-full px-6 py-[13px] text-[14px] font-semibold tracking-[0.03em] no-underline bb-gold-btn"
              style={{ boxShadow: "0 8px 22px rgba(231,178,76,.26),inset 0 1px 0 rgba(255,255,255,.5)" }}
            >
              <Phone size={15} /> {t.hero.call}
            </a>
          </div>

          {/* mobile hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-[46px] w-[46px] items-center justify-center rounded-[12px] text-gold-200 md:hidden"
            style={{
              border: "1px solid rgba(231,178,76,.3)",
              background: "rgba(231,178,76,.07)",
            }}
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* mobile overlay menu */}
      {menuOpen ? (
        <div
          className="fixed inset-0 z-[55] flex flex-col px-[9%] pb-10 pt-[90px] md:hidden"
          style={{ background: "rgba(8,4,10,.97)", backdropFilter: "blur(8px)" }}
        >
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="absolute right-[9%] top-[18px] flex h-[46px] w-[46px] items-center justify-center rounded-[12px] text-gold-200"
            style={{ border: "1px solid rgba(231,178,76,.3)", background: "transparent" }}
          >
            <X size={22} />
          </button>
          <div className="mt-[10px] flex flex-col gap-1.5">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="font-display text-[30px] font-medium text-[#ecdcb8] no-underline"
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(231,178,76,.1)",
                }}
              >
                {l.label}
              </a>
            ))}
          </div>
          <LangSwitch className="mt-[30px] self-start" />
          <a
            href={`tel:${PHONE}`}
            className="mt-[26px] inline-flex items-center justify-center gap-[9px] rounded-full p-4 font-semibold no-underline bb-gold-btn"
            style={{ boxShadow: "none" }}
          >
            <Phone size={16} /> {t.hero.call}
          </a>
        </div>
      ) : null}
    </>
  );
}
