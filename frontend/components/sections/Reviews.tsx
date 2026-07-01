"use client";

import { useMemo, useState } from "react";
import { Star, Plus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { initials } from "@/lib/utils";
import { addReview, useVisitorReviews } from "@/lib/reviewStore";
import type { Review } from "@/lib/types";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

/** One star filled 0..1 of its width (supports halves), over a dim outline. */
function StarIcon({ fill, size = 16 }: { fill: number; size?: number }) {
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
        <StarIcon key={i} fill={rating - (i - 1)} size={16} />
      ))}
      <span className="ml-2 text-[13px] text-sand-deep">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function Reviews() {
  const t = useT();
  const r = t.reviews;
  const visitorReviews = useVisitorReviews();
  const [open, setOpen] = useState(false);
  const [thanks, setThanks] = useState(false);

  // Built-in testimonials (from the dictionary) plus visitor-submitted ones on top.
  const builtins = useMemo<Review[]>(
    () => r.list.map((rev, i) => ({ id: `rev-${i + 1}`, ...rev })),
    [r.list],
  );
  const all = useMemo(() => [...visitorReviews, ...builtins], [visitorReviews, builtins]);

  const submit = (data: Omit<Review, "id">) => {
    addReview(data, Date.now());
    setOpen(false);
    setThanks(true);
    window.setTimeout(() => setThanks(false), 4000);
  };

  return (
    <section
      id="reviews"
      style={{ scrollMarginTop: 90, padding: "clamp(70px,9vw,140px) 0" }}
    >
      <div className="mx-auto w-[min(88%,1480px)]">
        <SectionHeading kicker={r.kicker} title={r.title} />

        {/* leave-a-review control */}
        <div className="mt-8 flex justify-center">
          {thanks ? (
            <div
              className="rounded-full px-6 py-3 text-[14px] text-gold-200"
              style={{ background: "rgba(231,178,76,.1)", border: "1px solid rgba(231,178,76,.4)" }}
            >
              ✓ {r.form.thanks}
            </div>
          ) : !open ? (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-gold-200"
              style={{ border: "1px solid rgba(231,178,76,.5)", background: "rgba(231,178,76,.07)" }}
            >
              <Plus size={16} /> {r.form.add}
            </button>
          ) : null}
        </div>

        {open ? (
          <ReviewForm form={r.form} onSubmit={submit} onCancel={() => setOpen(false)} />
        ) : null}

        <div
          className="mt-[40px] grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}
        >
          {all.map((review, i) => (
            <Reveal key={review.id} delay={(i % 3) * 0.06}>
              <div
                className="flex h-full flex-col rounded-[14px] px-7 py-[30px]"
                style={{
                  background: "linear-gradient(160deg,rgba(24,12,18,.85),rgba(13,8,15,.85))",
                  border: "1px solid rgba(231,178,76,.18)",
                }}
              >
                <Stars rating={review.rating} />
                <p
                  className="mb-0 mt-4 font-body text-[15.5px] font-light italic leading-[1.7]"
                  style={{ color: "#d6c7a9" }}
                >
                  “{review.text}”
                </p>
                <div className="mt-auto flex items-center gap-[13px] pt-[22px]">
                  <span
                    className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full font-display text-[18px] text-gold-300"
                    style={{
                      background: "linear-gradient(150deg,#3a1d0c,#1a0c12)",
                      border: "1px solid rgba(231,178,76,.35)",
                    }}
                  >
                    {initials(review.name)}
                  </span>
                  <div>
                    <div className="text-[15px] font-medium" style={{ color: "#f0e2c5" }}>
                      {review.name}
                    </div>
                    {review.role ? (
                      <div className="text-[12.5px] tracking-[0.04em] text-muted">
                        {review.role}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewForm({
  form,
  onSubmit,
  onCancel,
}: {
  form: ReturnType<typeof useT>["reviews"]["form"];
  onSubmit: (data: Omit<Review, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);

  const valid = name.trim() && text.trim();

  const inputStyle = {
    border: "1px solid rgba(231,178,76,.22)",
    background: "rgba(231,178,76,.05)",
  } as const;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({ name: name.trim(), role: role.trim(), text: text.trim(), rating });
      }}
      className="mx-auto mt-6 flex w-[min(100%,560px)] flex-col gap-3 rounded-[16px] p-6"
      style={{
        background: "linear-gradient(160deg,rgba(24,12,18,.9),rgba(13,8,15,.9))",
        border: "1px solid rgba(231,178,76,.28)",
        boxShadow: "0 30px 80px rgba(0,0,0,.5)",
      }}
    >
      <div className="font-display text-[20px] text-gold-300">{form.title}</div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-sand-deep">{form.rating}</span>
        <RatingInput value={rating} onChange={setRating} />
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={form.namePh}
        autoFocus
        className="rounded-[11px] px-[15px] py-[12px] text-[14px] text-cream outline-none"
        style={inputStyle}
      />
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder={form.rolePh}
        className="rounded-[11px] px-[15px] py-[12px] text-[14px] text-cream outline-none"
        style={inputStyle}
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={form.textPh}
        rows={4}
        className="resize-none rounded-[11px] px-[15px] py-[12px] text-[14px] text-cream outline-none"
        style={inputStyle}
      />

      <div className="mt-1 flex gap-3">
        <button
          type="submit"
          disabled={!valid}
          className="flex-1 rounded-[11px] border-none py-[12px] text-[15px] font-semibold bb-gold-btn disabled:cursor-not-allowed disabled:opacity-50"
          style={{ boxShadow: "none" }}
        >
          {form.submit}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-[11px] px-5 py-[12px] text-[14px] text-sand"
          style={{ border: "1px solid rgba(231,178,76,.25)", background: "transparent" }}
        >
          {form.cancel}
        </button>
      </div>
    </form>
  );
}

/** Interactive rating: click a star's left half for X.5, right half for X.0. */
function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  const size = 26;
  return (
    <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(null)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <StarIcon fill={shown - (i - 1)} size={size} />
            <button
              type="button"
              aria-label={`${i - 0.5}`}
              onMouseEnter={() => setHover(i - 0.5)}
              onClick={() => onChange(i - 0.5)}
              className="absolute left-0 top-0 h-full w-1/2 cursor-pointer border-none bg-transparent p-0"
            />
            <button
              type="button"
              aria-label={`${i}`}
              onMouseEnter={() => setHover(i)}
              onClick={() => onChange(i)}
              className="absolute right-0 top-0 h-full w-1/2 cursor-pointer border-none bg-transparent p-0"
            />
          </span>
        ))}
      </div>
      <span className="text-[13px] text-sand-deep">{shown.toFixed(1)}</span>
    </div>
  );
}
