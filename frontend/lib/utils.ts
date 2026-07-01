/** Tiny classnames helper — joins truthy class fragments. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Format an epoch-ms timestamp as HH:MM in the viewer's local time.
 * Only used in client-only views (chat widget + admin inbox), which are never
 * server-pre-rendered, so local time causes no hydration mismatch.
 */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
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
