"use client";

import { useState } from "react";

/**
 * Muted, looping, auto-playing promo reel (browsers allow muted autoplay). Drop
 * the file at `frontend/public/assets/promo.mp4` (served at /assets/promo.mp4).
 * If the file is missing the element hides itself, so the section degrades
 * cleanly until the real reel is supplied.
 */
export default function PromoVideo({ src = "/assets/promo.mp4" }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <div
      className="relative overflow-hidden rounded-[10px]"
      style={{
        border: "1px solid rgba(231,178,76,.22)",
        boxShadow: "0 30px 70px rgba(0,0,0,.55)",
      }}
    >
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
        className="block h-auto w-full"
        style={{ objectFit: "cover", background: "#120a07" }}
      />
    </div>
  );
}
