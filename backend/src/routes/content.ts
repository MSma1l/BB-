/**
 * Read-only content routes (BACKEND_TODO #5).
 *
 * Serve the trilingual services catalogue and seeded testimonials per locale.
 * Both are public GETs. An invalid/missing `locale` falls back to "ru" (the
 * default locale) rather than erroring, so the site always renders.
 */
import { Router } from "express";
import { isLocale, type Locale } from "../constants";
import { SERVICES, TESTIMONIALS } from "../content/catalogue";

export const contentRouter = Router();

/** Read `?locale=` and normalize to a valid Locale (default "ru"). */
function resolveLocale(raw: unknown): Locale {
  return typeof raw === "string" && isLocale(raw) ? raw : "ru";
}

// GET /api/content/services?locale=ru (public)
contentRouter.get("/services", (req, res) => {
  const locale = resolveLocale(req.query.locale);
  res.json(SERVICES[locale]);
});

// GET /api/content/testimonials?locale=ru (public)
contentRouter.get("/testimonials", (req, res) => {
  const locale = resolveLocale(req.query.locale);
  res.json(TESTIMONIALS[locale]);
});
