"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

/**
 * Full-screen intro video shown on first paint, then fades out. Auto-ends when
 * the video finishes (hard cap as a safety net) or when the visitor skips.
 */
export default function IntroPreloader() {
  const t = useT();
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);
  const capRef = useRef<number | undefined>(undefined);

  const end = () => {
    setFading(true);
    // Land on the Hero (top) when the intro clears — the site always opens there.
    if (!window.location.hash) window.scrollTo(0, 0);
    // Signal the intro is over so ambient music can start (see BackgroundMusic).
    window.dispatchEvent(new Event("bb-intro-done"));
    window.setTimeout(() => setGone(true), 600);
  };

  useEffect(() => {
    // Always open at the top (Hero): stop the browser restoring a prior scroll
    // position on reload, and pin to the top on first load.
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {
      /* ignore */
    }
    if (!window.location.hash) window.scrollTo(0, 0);

    // Safety net in case the video never fires `ended`.
    capRef.current = window.setTimeout(end, 10000);
    return () => window.clearTimeout(capRef.current);
  }, []);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden"
      style={{
        background: "#06030a",
        opacity: fading ? 0 : 1,
        transition: "opacity .6s ease",
      }}
    >
      <video
        src="/assets/intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={end}
        className="h-full w-full"
        style={{ objectFit: "contain", background: "#06030a" }}
      />
      <button
        onClick={end}
        className="absolute bottom-[30px] left-1/2 -translate-x-1/2 cursor-pointer border-none bg-transparent text-[11px] uppercase tracking-[0.28em] text-muted"
      >
        {t.introSkip} →
      </button>
    </div>
  );
}
