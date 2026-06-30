"use client";

import { useLocale } from "@/lib/i18n";
import { LOCALES } from "@/lib/types";
import { cn } from "@/lib/utils";

/** RU / RO / EN pill switcher. Shared by the site nav, admin login, and admin. */
export default function LangSwitch({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <div
      className={cn("flex gap-1 rounded-full p-1", className)}
      style={{ border: "1px solid rgba(231,178,76,.2)" }}
    >
      {LOCALES.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-[7px] text-[12px] font-semibold uppercase tracking-[0.08em]",
              active ? "text-[#2a1606]" : "text-[#b6a684]",
            )}
            style={
              active
                ? { background: "linear-gradient(180deg,#fbe7a8,#bd8a2e)" }
                : { background: "transparent" }
            }
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
