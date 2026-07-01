"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Auto-advancing cross-fade image carousel. Fills its (positioned) parent.
 * Advances every `intervalMs`; pauses for `prefers-reduced-motion` users.
 *
 * `fit="contain"` shows the WHOLE photo (never cropped) and fills the leftover
 * frame with a blurred copy of the same image, so mixed-aspect photos look
 * framed instead of letterboxed. `fit="cover"` (default) crops to fill.
 */
export default function Carousel({
  images,
  alt,
  intervalMs = 2000,
  sizes,
  priority = false,
  fit = "cover",
  startIndex = 0,
}: {
  images: string[];
  alt: string;
  intervalMs?: number;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  /** Offset the first shown image so tiled carousels look de-synced. */
  startIndex?: number;
}) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (images.length <= 1) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // honor reduced-motion: hold on the first image
    }
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [images.length, intervalMs]);

  // No images (admin deleted them all) — render nothing over the styled frame.
  if (images.length === 0) return null;
  const safeIndex = index % images.length;
  const contain = fit === "contain";

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={safeIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {contain && (
            // Blurred, darkened fill behind the contained photo.
            <Image
              src={images[safeIndex]}
              alt=""
              aria-hidden
              fill
              sizes={sizes ?? "100vw"}
              className="scale-110 object-cover"
              style={{ filter: "blur(28px) brightness(0.5)" }}
            />
          )}
          <Image
            src={images[safeIndex]}
            alt={alt}
            fill
            priority={priority && safeIndex === 0}
            sizes={sizes ?? "100vw"}
            className={contain ? "object-contain" : "object-cover"}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
