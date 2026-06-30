/** Tiny classnames helper — joins truthy class fragments. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Format an epoch-ms timestamp as HH:MM.
 * Uses UTC so server pre-render and client hydration agree (no mismatch).
 */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Zero-pad a number to two digits ("7" → "07"). */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Up to two uppercase initials from a name ("Elena & Andrei" → "EA"). */
export function initials(name: string): string {
  return (name || "")
    .split(/[\s&·]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}
