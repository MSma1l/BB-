/**
 * Admin auth, backed by the REST API (backend/API_CONTRACT.md §Auth).
 *
 * `login()` verifies credentials server-side (POST /admin/login) and stores the
 * returned JWT; `isAuthed()` checks the token's `exp`; `logout()` clears it.
 * The token is attached as a Bearer header to admin calls by `lib/api.ts`.
 */

import { apiJson, clearToken, getToken, setToken } from "@/lib/api";

/** POST credentials; on success store the JWT and return true, else false. */
export async function login(username: string, password: string): Promise<boolean> {
  try {
    const res = await apiJson<{ token: string; expiresIn?: number }>(
      "/admin/login",
      { method: "POST", json: { username, password } },
    );
    if (res?.token) {
      setToken(res.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Decode a JWT payload's `exp` (seconds). Returns null if unreadable. */
function tokenExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded =
      typeof atob === "function"
        ? atob(normalized)
        : Buffer.from(normalized, "base64").toString("binary");
    const data = JSON.parse(decoded) as { exp?: number };
    return typeof data.exp === "number" ? data.exp : null;
  } catch {
    return null;
  }
}

/** True if a token exists and its JWT `exp` is still in the future. */
export function isAuthed(): boolean {
  const token = getToken();
  if (!token) return false;
  const exp = tokenExp(token);
  // If the token carries no exp, treat mere presence as authed.
  if (exp === null) return true;
  return exp * 1000 > Date.now();
}

/** Header block for admin API calls (kept for callers that need it directly). */
export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** End the admin session. */
export function logout(): void {
  clearToken();
}
