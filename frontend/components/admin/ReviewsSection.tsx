"use client";

import { Star, Check, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { initials } from "@/lib/utils";
import { approveReview, removeReview, usePendingReviews } from "@/lib/reviewStore";

/** One star filled 0..1 of its width (supports halves), over a dim outline. */
function StarIcon({ fill, size = 15 }: { fill: number; size?: number }) {
  const pct = Math.max(0, Math.min(1, fill)) * 100;
  return (
    <span className="relative inline-block align-middle" style={{ width: size, height: size }}>
      <Star size={size} className="absolute inset-0 text-gold-400" fill="none" style={{ opacity: 0.35 }} />
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <Star size={size} className="text-gold-400" fill="currentColor" />
      </span>
    </span>
  );
}

/** Read-only rating display: 5 stars (with halves) + the numeric value. */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} fill={rating - (i - 1)} size={15} />
      ))}
      <span className="ml-2 text-[13px] text-sand-deep">{rating.toFixed(1)}</span>
    </div>
  );
}

/**
 * Admin "Reviews" section: the moderation queue. Visitor-submitted reviews land
 * here pending approval; the admin can approve (publish) or reject (delete) each
 * one. Backed by the shared review store — the queue stays live via SSE.
 */
export default function ReviewsSection() {
  const t = useT();
  const pending = usePendingReviews();

  return (
    <div className="h-full overflow-y-auto px-[clamp(16px,3vw,32px)] py-7">
      <div className="mx-auto max-w-[900px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 font-display text-[28px] font-semibold text-gold-300">
            {t.admin.reviews.title}
          </h2>
          {pending.length ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] font-semibold text-gold-200"
              style={{ border: "1px solid rgba(231,178,76,.28)", background: "rgba(231,178,76,.08)" }}
            >
              {t.admin.reviews.pending}: {pending.length}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[14px] text-sand-deep">{t.admin.reviews.intro}</p>

        {pending.length === 0 ? (
          <div className="mt-10 py-[50px] text-center text-[14px] text-dim">
            {t.admin.reviews.empty}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3.5">
            {pending.map((r) => (
              <article
                key={r.id}
                className="rounded-[14px] p-[18px]"
                style={{ border: "1px solid rgba(231,178,76,.16)", background: "rgba(12,7,14,.5)" }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full font-display text-gold-300"
                    style={{
                      background: "linear-gradient(150deg,#3a1d0c,#1a0c12)",
                      border: "1px solid rgba(231,178,76,.3)",
                    }}
                  >
                    {initials(r.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-[15px] font-medium" style={{ color: "#f0e2c5" }}>
                        {r.name}
                      </span>
                      <Stars rating={r.rating} />
                    </div>
                    {r.role ? (
                      <div className="mt-[2px] text-[12.5px] text-muted">{r.role}</div>
                    ) : null}
                    <p className="mt-2.5 whitespace-pre-line text-[14px] leading-[1.55] text-cream">
                      {r.text}
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 flex justify-end gap-2.5">
                  <button
                    onClick={() => removeReview(r.id)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-[9px] text-[13px] font-medium"
                    style={{
                      border: "1px solid rgba(209,58,90,.45)",
                      background: "rgba(209,58,90,.1)",
                      color: "#f0a5b5",
                    }}
                  >
                    <X size={15} /> {t.admin.reviews.reject}
                  </button>
                  <button
                    onClick={() => approveReview(r.id)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-none px-4 py-[9px] text-[13px] font-semibold"
                    style={{ background: "linear-gradient(180deg,#fbe7a8,#bd8a2e)", color: "#2a1606" }}
                  >
                    <Check size={15} /> {t.admin.reviews.approve}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
