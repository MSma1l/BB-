"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/types";
import { getDictionary } from "@/content/i18n";
import { useLocale } from "@/lib/i18n";
import {
  loadLocaleOverrides,
  resetLocaleTexts,
  setTextOverride,
  type LocaleOverrides,
} from "@/lib/contentStore";

const LANG_LABEL: Record<Locale, string> = { ru: "RU", ro: "RO", en: "EN" };

/** Turn a path segment into a friendly label ("titleA" → "Title a", "0" → "#1"). */
function humanize(key: string): string {
  if (/^\d+$/.test(key)) return `#${Number(key) + 1}`;
  const spaced = key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Admin "Content" section: edit every string on the site, per language.
 * Edits are saved to the shared text store and appear on the public site live.
 * BACKEND: the store persists to localStorage today; swap it for a content API.
 */
export default function TextsSection() {
  const { locale, t } = useLocale();
  const [tab, setTab] = useState<Locale>(locale);
  const [overrides, setOverrides] = useState<LocaleOverrides>({});
  // Bumped on reset so uncontrolled inputs re-initialise from the defaults.
  const [rev, setRev] = useState(0);

  const dict = useMemo(() => getDictionary(tab), [tab]);

  useEffect(() => {
    setOverrides(loadLocaleOverrides(tab));
  }, [tab, rev]);

  const valueFor = (path: string, base: string | number) =>
    overrides[path] !== undefined ? overrides[path] : base;

  const onEdit = (path: string, value: string | number) => {
    setTextOverride(tab, path, value);
    // keep local map current without a full re-render of the tree
    overrides[path] = value;
  };

  const resetLang = () => {
    resetLocaleTexts(tab);
    setRev((r) => r + 1);
  };

  return (
    <div className="h-full overflow-y-auto px-[clamp(16px,3vw,32px)] py-7">
      <div className="mx-auto max-w-[900px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 font-display text-[28px] font-semibold text-gold-300">
            {t.admin.texts.title}
          </h2>
          <button
            onClick={resetLang}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] text-sand"
            style={{ border: "1px solid rgba(231,178,76,.2)", background: "transparent" }}
          >
            <RotateCcw size={13} /> {t.admin.texts.resetLang}
          </button>
        </div>
        <p className="mt-1 text-[14px] text-sand-deep">{t.admin.texts.intro}</p>

        <div
          className="mt-4 rounded-[10px] px-4 py-3 text-[13px] text-gold-300"
          style={{ background: "rgba(231,178,76,.08)", border: "1px solid rgba(231,178,76,.22)" }}
        >
          ⓘ {t.admin.texts.note}
        </div>

        {/* language tabs */}
        <div className="mt-5 flex gap-2">
          {LOCALES.map((l) => {
            const active = l === tab;
            return (
              <button
                key={l}
                onClick={() => setTab(l)}
                className="cursor-pointer rounded-full px-5 py-[9px] text-[13px] font-semibold tracking-[0.05em]"
                style={
                  active
                    ? { background: "linear-gradient(180deg,#fbe7a8,#bd8a2e)", color: "#2a1606" }
                    : { border: "1px solid rgba(231,178,76,.2)", background: "transparent", color: "#e9d9b6" }
                }
              >
                {LANG_LABEL[l]}
              </button>
            );
          })}
        </div>

        {/* editable tree — one collapsible group per top-level section */}
        <div className="mt-5 flex flex-col gap-2.5">
          {Object.entries(dict).map(([key, value], i) => (
            <details
              key={`${tab}:${rev}:${key}`}
              open={i === 0}
              className="overflow-hidden rounded-[12px]"
              style={{ border: "1px solid rgba(231,178,76,.16)", background: "rgba(12,7,14,.5)" }}
            >
              <summary
                className="cursor-pointer list-none px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-gold-500"
                style={{ userSelect: "none" }}
              >
                {humanize(key)}
              </summary>
              <div className="flex flex-col gap-4 px-4 pb-5 pt-1">
                <Node value={value} path={key} label={humanize(key)} depth={0} valueFor={valueFor} onEdit={onEdit} keyPrefix={`${tab}:${rev}`} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

interface NodeProps {
  value: unknown;
  path: string;
  label: string;
  depth: number;
  valueFor: (path: string, base: string | number) => string | number;
  onEdit: (path: string, value: string | number) => void;
  keyPrefix: string;
}

/** Recursively render a dictionary node: strings/numbers as fields, objects and
 *  arrays as nested groups. */
function Node({ value, path, label, depth, valueFor, onEdit, keyPrefix }: NodeProps) {
  if (typeof value === "string" || typeof value === "number") {
    return (
      <Field
        inputKey={`${keyPrefix}:${path}`}
        label={label}
        path={path}
        value={valueFor(path, value)}
        isNumber={typeof value === "number"}
        onEdit={onEdit}
      />
    );
  }

  if (value && typeof value === "object") {
    const entries = Array.isArray(value)
      ? value.map((v, i) => [String(i), v] as const)
      : Object.entries(value as Record<string, unknown>);
    return (
      <div
        className={depth > 0 ? "flex flex-col gap-4 border-l pl-4" : "flex flex-col gap-4"}
        style={depth > 0 ? { borderColor: "rgba(231,178,76,.14)" } : undefined}
      >
        {depth > 0 ? (
          <div className="text-[11px] uppercase tracking-[0.16em] text-gold-600">{label}</div>
        ) : null}
        {entries.map(([k, v]) => (
          <Node
            key={k}
            value={v}
            path={`${path}.${k}`}
            label={humanize(k)}
            depth={depth + 1}
            valueFor={valueFor}
            onEdit={onEdit}
            keyPrefix={keyPrefix}
          />
        ))}
      </div>
    );
  }

  return null;
}

function Field({
  inputKey,
  label,
  path,
  value,
  isNumber,
  onEdit,
}: {
  inputKey: string;
  label: string;
  path: string;
  value: string | number;
  isNumber: boolean;
  onEdit: (path: string, value: string | number) => void;
}) {
  const long = !isNumber && String(value).length > 60;
  const shared = {
    key: inputKey,
    defaultValue: String(value),
    title: path,
    className:
      "w-full rounded-[9px] px-3 py-2 text-[14px] text-cream outline-none",
    style: {
      border: "1px solid rgba(231,178,76,.2)",
      background: "rgba(231,178,76,.05)",
    } as const,
  };
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] text-sand-deep">{label}</span>
      {isNumber ? (
        <input
          {...shared}
          type="number"
          onChange={(e) => onEdit(path, e.target.value === "" ? 0 : Number(e.target.value))}
        />
      ) : long ? (
        <textarea
          {...shared}
          rows={Math.min(6, Math.ceil(String(value).length / 60) + 1)}
          onChange={(e) => onEdit(path, e.target.value)}
        />
      ) : (
        <input {...shared} type="text" onChange={(e) => onEdit(path, e.target.value)} />
      )}
    </label>
  );
}
