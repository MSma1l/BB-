import type { Accent } from "@/lib/types";

// Accent themes ported from the DC prototype. Each sets the two CSS variables
// (--bb-accent / --bb-accent-deep) the rest of the design reads from.
export const ACCENTS: Record<Accent, { accent: string; deep: string }> = {
  crimson: { accent: "#b3243a", deep: "#5a0f1c" },
  purple: { accent: "#8a2f9e", deep: "#3a0f44" },
  "gold-green": { accent: "#9aa83a", deep: "#3a3a12" },
  sakura: { accent: "#e090ad", deep: "#5e2336" },
};

/** The site-wide default accent (matches the prototype's default prop). */
export const DEFAULT_ACCENT: Accent = "crimson";
