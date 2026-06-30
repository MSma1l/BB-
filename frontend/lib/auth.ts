/**
 * TEMPORARY client-side admin auth.
 *
 * ⚠️ This is deterrence, not real security: the credentials below ship in the
 * browser bundle and can be read by anyone who looks. It only keeps the admin
 * out of casual reach until a backend exists.
 *
 * BACKEND: replace the body of `login()` with a real API call that verifies
 * credentials server-side and returns a session token; keep the same signature
 * so the login UI (components/chat/AdminLogin.tsx) needs no changes. Swap the
 * sessionStorage flag for the real token/cookie at the same time.
 */

// Change these to set the admin credentials (placeholder values).
const ADMIN_USER = "admin";
const ADMIN_PASS = "bbreeze-admin";

const AUTH_KEY = "bb_admin_authed";

/** Verify credentials. Returns true on success and marks the session authed. */
export async function login(username: string, password: string): Promise<boolean> {
  const ok = username.trim() === ADMIN_USER && password === ADMIN_PASS;
  if (ok) {
    try {
      sessionStorage.setItem(AUTH_KEY, "1");
    } catch {
      /* sessionStorage unavailable — stay authed for this render only */
    }
  }
  return ok;
  // LATER:
  // const res = await fetch("/api/admin/login", {
  //   method: "POST",
  //   body: JSON.stringify({ username, password }),
  // });
  // return res.ok;
}

/** Whether the current session is already authenticated. */
export function isAuthed(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

/** End the admin session. */
export function logout(): void {
  try {
    sessionStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}
