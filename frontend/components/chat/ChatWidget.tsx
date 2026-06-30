"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MessageCircle, X, Send } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useUI } from "@/lib/ui";
import { formatTime } from "@/lib/utils";
import type { ChatMessage, Dictionary } from "@/lib/types";

// Fixed seed timestamp keeps SSR and first client paint identical.
const SEED_TS = Date.UTC(2026, 5, 29, 14, 0, 0);

interface Contact {
  first: string;
  last: string;
  phone: string;
}

/** Personalized welcome: "Hello, {first} {last}! 👋 …". */
function buildGreeting(t: Dictionary, c: Contact | null): string {
  const who = c ? `, ${c.first} ${c.last}` : "";
  return `${t.chat.hello}${who}! ${t.chat.greeting}`;
}

export default function ChatWidget() {
  const t = useT();
  const { chatOpen, toggleChat, closeChat } = useUI();
  const [contact, setContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<Contact>({ first: "", last: "", phone: "" });
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  // Keep the seeded greeting localized (and named) if the language changes.
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === "greet" ? { ...m, text: buildGreeting(t, contact) } : m,
      ),
    );
  }, [t, contact]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, chatOpen, contact]);

  const submitContact = (e: React.FormEvent) => {
    e.preventDefault();
    const c: Contact = {
      first: form.first.trim(),
      last: form.last.trim(),
      phone: form.phone.trim(),
    };
    if (!c.first || !c.last || !c.phone) return;
    setContact(c);
    setMessages([
      { id: "greet", from: "operator", text: buildGreeting(t, c), ts: SEED_TS },
    ]);
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `v${nextId.current++}`, from: "visitor", text, ts: Date.now() },
    ]);
    setDraft("");
  };

  const formValid =
    form.first.trim() && form.last.trim() && form.phone.trim();

  const inputStyle = {
    border: "1px solid rgba(231,178,76,.22)",
    background: "rgba(231,178,76,.05)",
  } as const;

  return (
    <div className="fixed bottom-[clamp(16px,3vw,30px)] right-[clamp(16px,3vw,30px)] z-[60] flex flex-col items-end gap-[14px]">
      {chatOpen ? (
        <div
          className="flex flex-col overflow-hidden rounded-[16px]"
          style={{
            width: "min(92vw,370px)",
            height: "min(72svh,540px)",
            background: "linear-gradient(180deg,#140a10,#0c0710)",
            border: "1px solid rgba(231,178,76,.28)",
            boxShadow: "0 30px 80px rgba(0,0,0,.6)",
          }}
        >
          {/* header */}
          <div
            className="flex items-center gap-3 px-[18px] py-[15px]"
            style={{
              background: "linear-gradient(160deg,#23120a,#15090f)",
              borderBottom: "1px solid rgba(231,178,76,.2)",
            }}
          >
            <Image
              src="/assets/logo-bb.jpg"
              alt="BB"
              width={38}
              height={38}
              className="h-[38px] w-[38px] rounded-full object-cover"
              style={{ mixBlendMode: "screen" }}
            />
            <div className="flex-1">
              <div className="font-display text-[18px] tracking-[0.04em] text-gold-300">
                {t.chat.title}
              </div>
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#8fcf9a" }}>
                <span
                  className="h-[7px] w-[7px] rounded-full"
                  style={{ background: "#5fd07a", boxShadow: "0 0 8px #5fd07a" }}
                />
                {t.chat.online}
              </div>
            </div>
            <button
              onClick={closeChat}
              aria-label="Minimize chat"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-[18px] text-gold-300"
              style={{ border: "1px solid rgba(231,178,76,.25)", background: "transparent" }}
            >
              —
            </button>
          </div>

          {!contact ? (
            /* first-open intake form */
            <form
              onSubmit={submitContact}
              className="flex flex-1 flex-col gap-3 overflow-y-auto p-[18px]"
            >
              <div className="font-display text-[20px] text-gold-300">
                {t.chat.formTitle}
              </div>
              <input
                value={form.first}
                onChange={(e) => setForm((f) => ({ ...f, first: e.target.value }))}
                placeholder={t.chat.namePh}
                autoFocus
                className="rounded-[11px] px-[15px] py-[13px] text-[14px] text-cream outline-none"
                style={inputStyle}
              />
              <input
                value={form.last}
                onChange={(e) => setForm((f) => ({ ...f, last: e.target.value }))}
                placeholder={t.chat.surnamePh}
                className="rounded-[11px] px-[15px] py-[13px] text-[14px] text-cream outline-none"
                style={inputStyle}
              />
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder={t.chat.phonePh}
                type="tel"
                inputMode="tel"
                className="rounded-[11px] px-[15px] py-[13px] text-[14px] text-cream outline-none"
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={!formValid}
                className="mt-1 rounded-[11px] border-none py-[13px] text-[15px] font-semibold bb-gold-btn disabled:cursor-not-allowed disabled:opacity-50"
                style={{ boxShadow: "none" }}
              >
                {t.chat.start}
              </button>
              <div className="mt-auto text-center text-[11px] text-dim">{t.chat.hint}</div>
            </form>
          ) : (
            <>
              {/* messages */}
              <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-[18px]">
                {messages.map((m) => (
                  <Bubble key={m.id} mine={m.from === "visitor"} text={m.text} time={formatTime(m.ts)} />
                ))}
                <div className="mt-auto text-center text-[11px] text-dim">{t.chat.hint}</div>
              </div>

              {/* composer */}
              <div
                className="flex gap-[9px] p-[13px]"
                style={{ borderTop: "1px solid rgba(231,178,76,.18)", background: "rgba(8,4,10,.5)" }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={t.chat.placeholder}
                  className="flex-1 rounded-[11px] px-[15px] py-[13px] text-[14px] text-cream outline-none"
                  style={inputStyle}
                />
                <button
                  onClick={send}
                  aria-label="Send"
                  className="flex w-[46px] flex-none items-center justify-center rounded-[11px] border-none text-[18px] bb-gold-btn"
                  style={{ boxShadow: "none" }}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      <button
        onClick={toggleChat}
        aria-label="Open chat"
        className="flex h-[62px] w-[62px] items-center justify-center rounded-full border-none text-[26px] bb-gold-btn"
        style={{ animation: "bbPulse 2.6s ease-in-out infinite", boxShadow: "none" }}
      >
        {chatOpen ? <X size={26} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}

function Bubble({ mine, text, time }: { mine: boolean; text: string; time: string }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
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
        {text}
        <div className="mt-[5px] text-right text-[10px] opacity-50">{time}</div>
      </div>
    </div>
  );
}
