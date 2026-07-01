"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Images, Bell } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { loadConversations, subscribe } from "@/lib/chatStore";
import LangSwitch from "@/components/ui/LangSwitch";
import MessagesSection from "@/components/admin/MessagesSection";
import PhotosSection from "@/components/admin/PhotosSection";

type Section = "messages" | "photos";

/** Count visitor messages across all threads — the "new message" signal. */
function visitorStats(): { count: number; latestName: string } {
  let count = 0;
  let latestTs = -1;
  let latestName = "";
  for (const c of loadConversations()) {
    for (const m of c.messages) {
      if (m.from !== "visitor") continue;
      count++;
      if (m.ts > latestTs) {
        latestTs = m.ts;
        latestName = `${c.first} ${c.last}`;
      }
    }
  }
  return { count, latestName };
}

/** The admin dashboard: header controls + a section menu + the active section. */
export default function AdminShell({ onLogout }: { onLogout: () => void }) {
  const t = useT();
  const [section, setSection] = useState<Section>("messages");
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // Refs keep the subscribe() callback free of stale closures over t/section.
  const sectionRef = useRef(section);
  sectionRef.current = section;
  const tRef = useRef(t);
  tRef.current = t;
  const seenCount = useRef<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch the shared store; a rise in the visitor-message count means a new
  // customer message just arrived (possibly from the customer's own tab).
  useEffect(() => {
    const check = () => {
      const { count, latestName } = visitorStats();
      if (seenCount.current === null) {
        seenCount.current = count; // baseline; don't announce existing history
        return;
      }
      if (count > seenCount.current) {
        const delta = count - seenCount.current;
        setToast(`${tRef.current.admin.newMessage} ${latestName}`);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 4500);
        if (sectionRef.current !== "messages") setUnread((u) => u + delta);
      }
      seenCount.current = count;
    };
    check();
    return subscribe(check);
  }, []);

  // Opening the inbox clears the unread badge.
  useEffect(() => {
    if (section === "messages") setUnread(0);
  }, [section]);

  const items: {
    id: Section;
    label: string;
    Icon: typeof MessageSquare;
    badge?: number;
  }[] = [
    { id: "messages", label: t.admin.nav.messages, Icon: MessageSquare, badge: unread },
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
        {items.map(({ id, label, Icon, badge }) => {
          const active = section === id;
          return (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={cn(
                "relative inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-[10px] text-[14px] font-medium transition-colors",
                active ? "text-[#2a1606]" : "text-sand",
              )}
              style={
                active
                  ? { background: "linear-gradient(180deg,#fbe7a8,#bd8a2e)" }
                  : { border: "1px solid rgba(231,178,76,.2)", background: "transparent" }
              }
            >
              <Icon size={16} /> {label}
              {badge ? (
                <span
                  className="ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-[18px] text-white"
                  style={{ background: "#d13a5a" }}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* active section */}
      <main className="min-h-0 flex-1">
        {section === "messages" ? <MessagesSection /> : <PhotosSection />}
      </main>

      {/* new-message toast */}
      {toast ? (
        <div
          className="fixed bottom-6 right-6 z-[80] flex items-center gap-2.5 rounded-[12px] px-4 py-3 text-[14px] text-cream"
          style={{
            background: "linear-gradient(160deg,#23120a,#15090f)",
            border: "1px solid rgba(231,178,76,.4)",
            boxShadow: "0 20px 50px rgba(0,0,0,.55)",
          }}
        >
          <Bell size={16} className="text-gold-300" />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
