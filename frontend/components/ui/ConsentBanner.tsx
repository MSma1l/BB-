"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { useConsent } from "@/lib/consent";

/** localStorage key holding the visitor's cookie/privacy choice. */
const CONSENT_KEY = "bb_consent";
type ConsentValue = "accepted" | "declined";

/** Read the stored consent choice, or null if none was made yet. SSR-safe. */
function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

/** Persist the visitor's choice. SSR-safe / never throws. */
function writeConsent(value: ConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage unavailable — the banner will simply reappear next load */
  }
}

/** Tiny helper others can import: has the visitor accepted consent yet? */
export function hasConsent(): boolean {
  return readConsent() === "accepted";
}

/**
 * GDPR-style cookie/privacy consent banner. Shown once (until a choice is
 * stored), fixed at the bottom and clear of the chat FAB (which sits at
 * z-[60], bottom-right); this bar uses z-[55] and pads its right edge on
 * mobile so its controls never fall under the floating button.
 */
export default function ConsentBanner() {
  const t = useT();
  const { openPolicy } = useConsent();
  // Start hidden so server HTML and the first client paint agree; reveal after
  // mount only if no choice has been stored yet (matches lib/i18n.tsx).
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readConsent() === null) setVisible(true);
  }, []);

  const decide = (value: ConsentValue) => {
    writeConsent(value);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-[55]"
          style={{
            paddingLeft: "calc(clamp(12px,3vw,26px) + env(safe-area-inset-left))",
            // Extra right padding clears the bottom-right chat FAB on mobile.
            paddingRight:
              "calc(clamp(12px,3vw,26px) + 74px + env(safe-area-inset-right))",
            paddingBottom:
              "calc(clamp(12px,3vw,20px) + env(safe-area-inset-bottom))",
            paddingTop: "clamp(12px,3vw,18px)",
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3 }}
          role="region"
          aria-label={t.consent.policyTitle}
        >
          <div
            className="mx-auto flex w-[min(100%,900px)] flex-col gap-3 rounded-[14px] px-[18px] py-[15px] md:flex-row md:items-center md:gap-5"
            style={{
              background: "linear-gradient(160deg,#150b11,#0b0710)",
              border: "1px solid rgba(231,178,76,.28)",
              boxShadow: "0 26px 70px rgba(0,0,0,.55)",
            }}
          >
            <p className="m-0 flex-1 text-[13px] leading-[1.55] text-sand-deep">
              {t.consent.message}{" "}
              <button
                type="button"
                onClick={openPolicy}
                className="cursor-pointer bg-transparent p-0 text-gold-300 underline underline-offset-2"
              >
                {t.consent.learnMore}
              </button>
            </p>
            <div className="flex flex-none gap-[10px]">
              <button
                type="button"
                onClick={() => decide("declined")}
                className="cursor-pointer rounded-full px-[22px] py-[11px] text-[14px] font-medium text-gold-200"
                style={{
                  border: "1px solid rgba(231,178,76,.5)",
                  background: "rgba(231,178,76,.06)",
                }}
              >
                {t.consent.decline}
              </button>
              <button
                type="button"
                onClick={() => decide("accepted")}
                className="cursor-pointer rounded-full border-none px-[22px] py-[11px] text-[14px] font-semibold bb-gold-btn"
                style={{ boxShadow: "none" }}
              >
                {t.consent.accept}
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
