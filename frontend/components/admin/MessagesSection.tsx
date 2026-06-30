"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Send, Phone } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { getSeedConversations } from "@/content/chat";
import { formatTime, initials } from "@/lib/utils";
import type { Conversation } from "@/lib/types";

/** Admin "Messages" section: a per-customer inbox + conversation thread. */
export default function MessagesSection() {
  const { locale, t } = useLocale();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileConv, setMobileConv] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    setConversations(getSeedConversations(locale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => b.ts - a.ts),
    [conversations],
  );
  const active = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [active?.messages.length, activeId]);

  const reply = () => {
    const text = draft.trim();
    if (!text || !activeId) return;
    const ts = Date.now();
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              ts,
              messages: [
                ...c.messages,
                { id: `o${nextId.current++}`, from: "operator", text, ts },
              ],
            }
          : c,
      ),
    );
    setDraft("");
  };

  const fullName = (c: Conversation) => `${c.first} ${c.last}`;

  return (
    <div className="flex h-full overflow-hidden">
      {/* conversation list */}
      <div
        className={`${mobileConv ? "hidden" : "flex"} w-full flex-col overflow-y-auto md:flex md:w-[340px] md:flex-none`}
        style={{ background: "rgba(12,7,14,.6)", borderRight: "1px solid rgba(231,178,76,.14)" }}
      >
        {sorted.length === 0 ? (
          <div className="px-6 py-[50px] text-center text-[14px] text-dim">
            {t.admin.emptyList}
          </div>
        ) : (
          sorted.map((c) => {
            const last = c.messages[c.messages.length - 1];
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveId(c.id);
                  setMobileConv(true);
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-[14px] text-left"
                style={{
                  borderBottom: "1px solid rgba(231,178,76,.08)",
                  background: isActive
                    ? "linear-gradient(90deg,rgba(231,178,76,.14),transparent)"
                    : "transparent",
                }}
              >
                <span
                  className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full font-display text-gold-300"
                  style={{
                    background: "linear-gradient(150deg,#3a1d0c,#1a0c12)",
                    border: "1px solid rgba(231,178,76,.3)",
                  }}
                >
                  {initials(fullName(c))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2">
                    <span className="truncate text-[14px] font-medium" style={{ color: "#f0e2c5" }}>
                      {fullName(c)}
                    </span>
                    <span className="flex-none text-[11px] text-muted">
                      {last ? formatTime(last.ts) : ""}
                    </span>
                  </span>
                  <span className="mt-[3px] block truncate text-[12.5px] text-muted">
                    {last ? last.text : ""}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* active conversation */}
      <div className={`${mobileConv ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}>
        {active ? (
          <>
            <div
              className="flex items-center gap-3 px-[clamp(16px,3vw,26px)] py-[15px]"
              style={{ borderBottom: "1px solid rgba(231,178,76,.16)", background: "rgba(20,10,16,.5)" }}
            >
              <button
                onClick={() => setMobileConv(false)}
                aria-label="Back to list"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] text-gold-300 md:hidden"
                style={{ border: "1px solid rgba(231,178,76,.25)", background: "transparent" }}
              >
                <ChevronLeft size={18} />
              </button>
              <span
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-gold-300"
                style={{
                  background: "linear-gradient(150deg,#3a1d0c,#1a0c12)",
                  border: "1px solid rgba(231,178,76,.3)",
                }}
              >
                {initials(fullName(active))}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[16px]" style={{ color: "#f0e2c5" }}>
                  {fullName(active)}
                </div>
                <a
                  href={`tel:${active.phone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1.5 text-[12.5px] text-gold-500 no-underline"
                  title={t.admin.phoneLabel}
                >
                  <Phone size={12} /> {active.phone}
                </a>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex flex-1 flex-col gap-3 overflow-y-auto px-[clamp(16px,3vw,26px)] py-[22px]"
              style={{ background: "radial-gradient(circle at 50% 0%,rgba(40,16,28,.3),transparent 60%)" }}
            >
              {active.messages.map((m) => {
                const mine = m.from === "operator";
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[80%] rounded-[14px] px-[14px] py-[11px] text-[14px] leading-[1.5]"
                      style={
                        mine
                          ? {
                              background: "linear-gradient(180deg,#fbe7a8,#d9a341)",
                              color: "#2a1606",
                              borderBottomRightRadius: 4,
                            }
                          : {
                              background: "rgba(231,178,76,.1)",
                              color: "#ecdcb8",
                              border: "1px solid rgba(231,178,76,.18)",
                              borderBottomLeftRadius: 4,
                            }
                      }
                    >
                      {m.text}
                      <div className="mt-[5px] text-right text-[10px] opacity-50">
                        {formatTime(m.ts)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="flex gap-[10px] px-[clamp(16px,3vw,26px)] py-[15px]"
              style={{ borderTop: "1px solid rgba(231,178,76,.18)", background: "rgba(8,4,10,.5)" }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    reply();
                  }
                }}
                placeholder={t.admin.replyPh}
                className="flex-1 rounded-[11px] px-4 py-[14px] text-[14px] text-cream outline-none"
                style={{ border: "1px solid rgba(231,178,76,.22)", background: "rgba(231,178,76,.05)" }}
              />
              <button
                onClick={reply}
                aria-label="Send reply"
                className="flex items-center justify-center rounded-[11px] border-none px-[22px] text-[18px] bb-gold-btn"
                style={{ boxShadow: "none" }}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[15px] text-dim">
            {t.admin.empty}
          </div>
        )}
      </div>
    </div>
  );
}
