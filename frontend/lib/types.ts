// Shared TypeScript contract for Balloons Breeze.
//
// These interfaces are the agreed data shapes between the frontend and the
// (future) backend. Change them deliberately, together with the backend dev.
// The three locale tables in `content/i18n/{ru,ro,en}.ts` all implement
// `Dictionary`, so the compiler guarantees they stay structurally in sync.

export type Locale = "ru" | "ro" | "en";

export const LOCALES: Locale[] = ["ru", "ro", "en"];
export const DEFAULT_LOCALE: Locale = "ru";

/** Accent themes ported from the DC prototype (`accent` prop). */
export type Accent = "crimson" | "purple" | "gold-green" | "sakura";

/** Gallery category keys — locale-independent; labels come from the dictionary. */
export type GalleryCategory =
  | "weddings"
  | "arches"
  | "photozones"
  | "birthdays"
  | "corporate";

export interface GalleryItem {
  id: string;
  category: GalleryCategory;
}

export interface Review {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
}

/** A review as authored in the i18n tables (id is assigned by the accessor). */
export type ReviewCopy = Omit<Review, "id">;

export interface ServiceGroup {
  title: string;
  items: string[];
}

export interface ServiceCategory {
  title: string;
  items: string[];
}

export interface ProcessStep {
  /** Zero-padded step number, e.g. "01". */
  n: string;
  /** lucide icon name resolved in the component. */
  icon: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  from: "visitor" | "operator";
  text: string;
  /** Epoch ms. */
  ts: number;
}

export interface Conversation {
  id: string;
  name: string;
  messages: ChatMessage[];
  /** Epoch ms of last activity. */
  ts: number;
}

// ── The translation dictionary shape ────────────────────────────────────────
// One `Dictionary` per locale. Mirrors the DC prototype's `T[lang]` object.

export interface Dictionary {
  nav: {
    about: string;
    services: string;
    gallery: string;
    process: string;
    why: string;
    reviews: string;
  };
  hero: {
    titleA: string;
    titleB: string;
    tagline: string;
    sub: string;
    call: string;
    quote: string;
    scroll: string;
    hint: string;
  };
  about: {
    kicker: string;
    title: string;
    name: string;
    role: string;
    bio: string;
    points: string[];
    badges: string[];
    imgA: string;
    imgB: string;
    quote: string;
  };
  services: {
    kicker: string;
    title: string;
    intro: string;
    wedding: {
      title: string;
      desc: string;
      note: string;
      groups: ServiceGroup[];
    };
    others: ServiceCategory[];
  };
  gallery: {
    kicker: string;
    title: string;
    cats: Record<"all" | GalleryCategory, string>;
  };
  process: {
    kicker: string;
    title: string;
    steps: string[];
  };
  why: {
    kicker: string;
    title: string;
    items: string[];
  };
  reviews: {
    kicker: string;
    title: string;
    list: ReviewCopy[];
  };
  footer: {
    kicker: string;
    title: string;
    phone: string;
    email: string;
    cityLabel: string;
    rights: string;
    admin: string;
    brandLine: string;
  };
  chat: {
    title: string;
    online: string;
    greeting: string;
    placeholder: string;
    hint: string;
  };
  admin: {
    title: string;
    subtitle: string;
    empty: string;
    emptyList: string;
    replyPh: string;
    back: string;
    guest: string;
  };
  /** Intro preloader "skip" label. */
  introSkip: string;
}
