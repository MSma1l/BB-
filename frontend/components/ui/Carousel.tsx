"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Auto-advancing cross-fade image carousel. Fills its (positioned) parent.
 * Advances every `intervalMs`; pauses for `prefers-reduced-motion` users.
 */
export default function Carousel({
  images,
  alt,
  intervalMs = 2000,
  sizes,
  priority = false,
}: {
  images: string[];
  alt: string;
  intervalMs?: number;
  sizes?: string;
  priority?: boolean;
}) {
  const [index, setIndex] = useState(0);

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

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <Image
            src={images[index]}
            alt={alt}
            fill
            priority={priority && index === 0}
            sizes={sizes ?? "100vw"}
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
