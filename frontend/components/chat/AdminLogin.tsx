"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useT } from "@/lib/i18n";
import { login } from "@/lib/auth";

/** Login gate for the /admin route. Calls lib/auth.login() (backend swap point). */
export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const t = useT();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const ok = await login(username, password);
    setBusy(false);
    if (ok) onSuccess();
    else setError(true);
  };

  const inputStyle = {
    border: "1px solid rgba(231,178,76,.22)",
    background: "rgba(231,178,76,.05)",
  } as const;

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-6"
      style={{ background: "#0a0510" }}
    >
      <form
        onSubmit={submit}
        className="flex w-full max-w-[360px] flex-col gap-3 rounded-[16px] p-7"
        style={{
          background: "linear-gradient(180deg,#140a10,#0c0710)",
          border: "1px solid rgba(231,178,76,.28)",
          boxShadow: "0 30px 80px rgba(0,0,0,.6)",
        }}
      >
        <div className="mb-1 flex items-center gap-3">
          <Image
            src="/assets/logo-bb.jpg"
            alt="BB"
            width={42}
            height={42}
            className="h-[42px] w-[42px] rounded-full object-cover"
            style={{ mixBlendMode: "screen" }}
          />
          <div className="font-display text-[20px] tracking-[0.04em] text-gold-300">
            {t.admin.loginTitle}
          </div>
        </div>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t.admin.userPh}
          autoFocus
          autoComplete="username"
          className="rounded-[11px] px-[15px] py-[13px] text-[14px] text-cream outline-none"
          style={inputStyle}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.admin.passPh}
          type="password"
          autoComplete="current-password"
          className="rounded-[11px] px-[15px] py-[13px] text-[14px] text-cream outline-none"
          style={inputStyle}
        />

        {error ? (
          <div className="text-[13px]" style={{ color: "#e0728a" }}>
            {t.admin.loginError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy || !username.trim() || !password}
          className="mt-1 rounded-[11px] border-none py-[13px] text-[15px] font-semibold bb-gold-btn disabled:cursor-not-allowed disabled:opacity-50"
          style={{ boxShadow: "none" }}
        >
          {t.admin.signIn}
        </button>

        <Link
          href="/"
          className="mt-1 text-center text-[12px] text-muted no-underline hover:text-gold-600"
        >
          ← {t.admin.back}
        </Link>
      </form>
    </div>
  );
}
