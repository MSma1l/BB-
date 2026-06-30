"use client";

import { useT } from "@/lib/i18n";
import { initials } from "@/lib/utils";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

function Stars({ rating }: { rating: number }) {
  // Four solid stars + a fifth that dims when the rating is below 5.
  const ops = [1, 1, 1, 1, rating >= 5 ? 1 : 0.3];
  return (
    <div className="flex gap-[3px]">
      {ops.map((op, i) => (
        <span key={i} className="text-[16px] text-gold-400" style={{ opacity: op }}>
          ★
        </span>
      ))}
      <span className="ml-2 text-[13px] text-sand-deep">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function Reviews() {
  const t = useT();
  const r = t.reviews;

  return (
    <section
      id="reviews"
      style={{
        scrollMarginTop: 90,
        padding: "clamp(70px,9vw,140px) 0",
        background: "linear-gradient(180deg,#08040a,#100614 50%,#08040a)",
      }}
    >
      <div className="mx-auto w-[min(88%,1480px)]">
        <SectionHeading kicker={r.kicker} title={r.title} />
        <div
          className="mt-[46px] grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}
        >
          {r.list.map((review, i) => (
            <Reveal key={`${review.name}-${i}`} delay={(i % 3) * 0.06}>
              <div
                className="flex h-full flex-col rounded-[14px] px-7 py-[30px]"
                style={{
                  background:
                    "linear-gradient(160deg,rgba(24,12,18,.85),rgba(13,8,15,.85))",
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
                    <div
                      className="text-[15px] font-medium"
                      style={{ color: "#f0e2c5" }}
                    >
                      {review.name}
                    </div>
                    <div className="text-[12.5px] tracking-[0.04em] text-muted">
                      {review.role}
                    </div>
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
