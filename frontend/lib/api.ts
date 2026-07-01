// Shared fetch helper + admin token storage + SSE helper for the backend wiring.
//
// The frontend calls the REST/SSE backend defined in backend/API_CONTRACT.md.
// The base URL is baked at build time from NEXT_PUBLIC_API_URL (default "/api",
// which nginx reverse-proxies to the backend, keeping calls same-origin).
//
// Every store imports `apiFetch` (JSON) and `sse` (server-sent events) from here
// and never talks to `fetch`/`EventSource` directly, so auth + error handling
// stay in one place.

/** Baked at build time; falls back to the same-origin "/api" proxy path. */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "/api";

/** localStorage key the admin JWT is stored under. */
const TOKEN_KEY = "bb_admin_token";

const canUse = () => typeof window !== "undefined";

/** The stored admin bearer token, or null (SSR-safe). */
export function getToken(): string | null {
  if (!canUse()) return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Persist the admin bearer token. */
export function setToken(token: string): void {
  if (!canUse()) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* localStorage unavailable */
  }
}

/** Clear the admin bearer token (logout / expiry). */
export function clearToken(): void {
  if (!canUse()) return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Fetch wrapper that prefixes API_BASE, sets JSON headers, attaches the admin
 * Bearer token when present, and throws `ApiError` on any non-2xx response.
 * Pass a plain object/array as `opts.json` to send a JSON body, or use the
 * standard `body` (e.g. FormData) for multipart uploads.
 */
export async function apiFetch(
  path: string,
  opts: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  const { json, headers, body, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  };

  let finalBody = body;
  if (json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    finalBody = JSON.stringify(json);
  }

  const token = getToken();
  if (token) finalHeaders["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") message = data.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }

  return res;
}

/** Convenience: `apiFetch` + parse JSON. */
export async function apiJson<T>(
  path: string,
  opts: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const res = await apiFetch(path, opts);
  return (await res.json()) as T;
}

/**
 * Open an SSE stream at API_BASE + path and invoke `onMessage` on every
 * `message` event. Returns an unsubscribe function. No-op (returns a noop
 * unsubscribe) during SSR. EventSource cannot send auth headers, so the backend
 * stream endpoints are public per the API contract.
 */
export function sse(path: string, onMessage: (data: string) => void): () => void {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => {};
  }
  let source: EventSource | null = null;
  try {
    source = new EventSource(`${API_BASE}${path}`);
    source.onmessage = (e: MessageEvent) => onMessage(e.data);
  } catch {
    return () => {};
  }
  return () => {
    try {
      source?.close();
    } catch {
      /* ignore */
    }
  };
}
