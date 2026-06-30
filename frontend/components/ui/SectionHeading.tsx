import Reveal from "@/components/ui/Reveal";

/** Kicker + serif title used at the top of most sections. */
export default function SectionHeading({
  kicker,
  title,
  intro,
  align = "center",
}: {
  kicker: string;
  title: string;
  intro?: string;
  align?: "center" | "left";
}) {
  return (
    <Reveal
      className={align === "center" ? "mx-auto max-w-[680px] text-center" : ""}
    >
      <div className="mb-4 text-xs font-body uppercase tracking-[0.34em] text-gold-600">
        — {kicker}
      </div>
      <h2
        className="m-0 font-display font-semibold leading-[1.08]"
        style={{ fontSize: "clamp(30px,3.8vw,54px)", color: "#f3e6cb" }}
      >
        {title}
      </h2>
      {intro ? (
        <p className="mt-[18px] font-body font-light text-[16px] text-sand-deep">
          {intro}
        </p>
      ) : null}
    </Reveal>
  );
}
