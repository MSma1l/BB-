"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll-into-view fade+rise. Replaces the prototype's CSS
 * `animation-timeline: view()` (Chromium-only) with a cross-browser
 * Framer Motion reveal. Respects prefers-reduced-motion via the global CSS.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
