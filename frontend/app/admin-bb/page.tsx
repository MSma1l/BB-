"use client";

import { useEffect, useState } from "react";
import AdminLogin from "@/components/chat/AdminLogin";
import AdminShell from "@/components/admin/AdminShell";
import { isAuthed, logout } from "@/lib/auth";

/**
 * /admin-bb — login-gated admin route. The credential check is client-side and
 * temporary (see lib/auth.ts); a backend will replace it with real auth.
 */
export default function AdminRoute() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  // Resolve the session flag after mount (keeps SSR/first paint identical).
  useEffect(() => {
    setAuthed(isAuthed());
    setReady(true);
  }, []);

  if (!ready) return null;

  return authed ? (
    <AdminShell
      onLogout={() => {
        logout();
        setAuthed(false);
      }}
    />
  ) : (
    <AdminLogin onSuccess={() => setAuthed(true)} />
  );
}
