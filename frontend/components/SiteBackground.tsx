"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useUI } from "@/lib/ui";

// WebGL must not render on the server.
const Balloons3D = dynamic(() => import("@/components/hero/Balloons3D"), {
  ssr: false,
});

/**
 * The site-wide backdrop: the nebula sky + floating 3D balloons, fixed behind
 * all page content. Pointer-events are disabled so the whole page stays
 * interactive; the balloon field reads the shared burst signal from the UI
 * context (Hero triggers it on click).
 */
export default function SiteBackground() {
  const { burstRef, triggerBurst } = useUI();

  // Release balloons on a click/tap anywhere on the page (was hero-only).
  useEffect(() => {
    const onClick = (e: MouseEvent) => triggerBurst(e.clientX, e.clientY);
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [triggerBurst]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* nebula photo */}
      <div
        className="absolute inset-0"
        style={{
          background: "url('/assets/nebula-bg.jpg') center/cover no-repeat",
        }}
      />
      {/* darkening vignette for text contrast — tinted dark-red at the edges so
          the backdrop continues the intro video's red tone (not black). */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 85% at 50% 33%,rgba(20,7,13,.32),rgba(15,6,11,.80) 70%,#140610)",
        }}
      />
      {/* floating balloons (above the nebula + vignette, below content) */}
      <Balloons3D burstRef={burstRef} />
    </div>
  );
}
