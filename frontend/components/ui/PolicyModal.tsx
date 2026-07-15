"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useConsent } from "@/lib/consent";

/**
 * Accessible privacy & cookie policy dialog. Opens from the consent banner or
 * the footer link (shared state via lib/consent.tsx). Closes on Esc or backdrop
 * click; mirrors the overlay/focus pattern of components/ui/Lightbox.tsx.
 */
export default function PolicyModal() {
  const t = useT();
  const { policyOpen, closePolicy } = useConsent();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!policyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePolicy();
    };
    window.addEventListener("keydown", onKey);
    // Move focus into the dialog so Esc/Tab land here (focus-trap-lite).
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [policyOpen, closePolicy]);

  return (
    <AnimatePresence>
      {policyOpen ? (
        <motion.div
          onClick={closePolicy}
          className="fixed inset-0 z-[75] flex items-center justify-center"
          style={{
            background: "rgba(5,2,7,.94)",
            backdropFilter: "blur(10px)",
            padding: "5vw",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bb-policy-title"
            className="relative flex flex-col overflow-hidden rounded-[16px]"
            style={{
              width: "min(92vw,640px)",
              maxHeight: "min(86svh,760px)",
              background: "linear-gradient(180deg,#140a10,#0c0710)",
              border: "1px solid rgba(231,178,76,.3)",
              boxShadow: "0 40px 100px rgba(0,0,0,.7)",
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* header */}
            <div
              className="flex items-center gap-3 px-[24px] py-[18px]"
              style={{
                background: "linear-gradient(160deg,#23120a,#15090f)",
                borderBottom: "1px solid rgba(231,178,76,.2)",
              }}
            >
              <h2
                id="bb-policy-title"
                className="m-0 flex-1 font-display text-[20px] tracking-[0.03em] text-gold-300"
              >
                {t.consent.policyTitle}
              </h2>
              <button
                ref={closeRef}
                onClick={closePolicy}
                aria-label={t.consent.close}
                className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] text-gold-300"
                style={{
                  border: "1px solid rgba(231,178,76,.25)",
                  background: "transparent",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* body */}
            <div className="flex flex-col gap-5 overflow-y-auto px-[24px] py-[22px]">
              {t.consent.policy.map((section) => (
                <section key={section.heading} className="flex flex-col gap-1.5">
                  <h3 className="m-0 font-display text-[16px] text-gold-200">
                    {section.heading}
                  </h3>
                  <p className="m-0 text-[14px] leading-[1.6] text-sand-deep">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
