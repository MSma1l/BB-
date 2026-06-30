"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Images } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import LangSwitch from "@/components/ui/LangSwitch";
import MessagesSection from "@/components/admin/MessagesSection";
import PhotosSection from "@/components/admin/PhotosSection";

type Section = "messages" | "photos";

/** The admin dashboard: header controls + a section menu + the active section. */
export default function AdminShell({ onLogout }: { onLogout: () => void }) {
  const t = useT();
  const [section, setSection] = useState<Section>("messages");

  const items: { id: Section; label: string; Icon: typeof MessageSquare }[] = [
    { id: "messages", label: t.admin.nav.messages, Icon: MessageSquare },
    { id: "photos", label: t.admin.nav.photos, Icon: Images },
  ];

  return (
    <div className="flex min-h-dvh flex-col" style={{ background: "#0a0510" }}>
      {/* header */}
      <header
        className="flex flex-wrap items-center justify-between gap-3 px-[clamp(16px,3vw,28px)] py-3"
        style={{
          background: "linear-gradient(160deg,#1a0d08,#0e0712)",
          borderBottom: "1px solid rgba(231,178,76,.2)",
        }}
      >
        <div className="flex items-center gap-[13px]">
          <Image
            src="/assets/logo-bb.jpg"
            alt="BB"
            width={42}
            height={42}
            className="h-[42px] w-[42px] rounded-full object-cover"
            style={{ mixBlendMode: "screen" }}
          />
          <div>
            <div className="font-display text-[20px] tracking-[0.06em] text-gold-300">
              {t.admin.title}
            </div>
            <div className="text-[12px] tracking-[0.1em] text-muted">
              {t.admin.subtitle}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <LangSwitch />
          <Link
            href="/"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-[11px] text-[14px] text-gold-200 no-underline"
            style={{ border: "1px solid rgba(231,178,76,.4)", background: "rgba(231,178,76,.06)" }}
          >
            ← {t.admin.back}
          </Link>
          <button
            onClick={onLogout}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-[11px] text-[14px] text-sand"
            style={{ border: "1px solid rgba(231,178,76,.2)", background: "transparent" }}
          >
            {t.admin.logout}
          </button>
        </div>
      </header>

      {/* section menu */}
      <nav
        className="flex gap-2 px-[clamp(16px,3vw,28px)] py-3"
        style={{ borderBottom: "1px solid rgba(231,178,76,.12)", background: "rgba(12,7,14,.5)" }}
      >
        {items.map(({ id, label, Icon }) => {
          const active = section === id;
          return (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-[10px] text-[14px] font-medium transition-colors",
                active ? "text-[#2a1606]" : "text-sand",
              )}
              style={
                active
                  ? { background: "linear-gradient(180deg,#fbe7a8,#bd8a2e)" }
                  : { border: "1px solid rgba(231,178,76,.2)", background: "transparent" }
              }
            >
              <Icon size={16} /> {label}
            </button>
          );
        })}
      </nav>

      {/* active section */}
      <main className="min-h-0 flex-1">
        {section === "messages" ? <MessagesSection /> : <PhotosSection />}
      </main>
    </div>
  );
}
