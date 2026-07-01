"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface LightboxSlide {
  /** Real image URL. When set, the slide shows the photo. */
  src?: string;
  /** Fallback placeholder styling (used when there is no `src`). */
  bg?: string;
  icon?: string;
  label?: string;
}

/** Full-screen gallery viewer. Closes on backdrop click / Esc; arrows cycle. */
export default function Lightbox({
  slides,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  slides: LightboxSlide[];
  index: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const open = index !== null && slides[index] !== undefined;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext]);

  const slide = open ? slides[index!] : null;

  return (
    <AnimatePresence>
      {slide ? (
        <motion.div
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-center justify-center"
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
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-[26px] top-[22px] flex h-[50px] w-[50px] items-center justify-center rounded-full text-[22px] text-gold-300"
            style={{
              border: "1px solid rgba(231,178,76,.4)",
              background: "rgba(20,8,14,.6)",
            }}
          >
            ✕
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous"
            className="absolute left-[3vw] top-1/2 flex h-[54px] w-[54px] -translate-y-1/2 items-center justify-center rounded-full text-[24px] text-gold-300"
            style={{
              border: "1px solid rgba(231,178,76,.4)",
              background: "rgba(20,8,14,.6)",
            }}
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next"
            className="absolute right-[3vw] top-1/2 flex h-[54px] w-[54px] -translate-y-1/2 items-center justify-center rounded-full text-[24px] text-gold-300"
            style={{
              border: "1px solid rgba(231,178,76,.4)",
              background: "rgba(20,8,14,.6)",
            }}
          >
            ›
          </button>

          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="relative overflow-hidden rounded-[12px]"
            style={{
              width: "min(86vw,1000px)",
              aspectRatio: "3/2",
              border: "1px solid rgba(231,178,76,.3)",
              boxShadow: "0 40px 100px rgba(0,0,0,.7)",
              background: slide.src ? "#0a0510" : slide.bg,
            }}
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {slide.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.src}
                alt={slide.label ?? ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--bb-accent) 24%,transparent),transparent 72%)",
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <span className="text-[64px] opacity-50">{slide.icon}</span>
                  <span className="font-body text-[14px] tracking-[0.18em] text-sand-deep">
                    {slide.label}
                  </span>
                </div>
              </>
            )}
            <div className="absolute bottom-[18px] left-6 text-[13px] tracking-[0.1em] text-sand">
              {index! + 1} / {slides.length}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
