/**
 * Server-side input sanitization for public (visitor-supplied) free text.
 *
 * The public write endpoints (reviews, conversations) accept arbitrary strings
 * from anonymous visitors. QA-1 found a raw `<img src=x onerror=alert(1)>`
 * payload accepted verbatim by POST /api/reviews. Even though the React client
 * escapes on render, the API must never persist live markup — a different
 * consumer (an email digest, an admin export, a future non-React client) could
 * render it. So we strip HTML tags at the trust boundary, before storage.
 *
 * Only tag-like sequences (`</?tag ...>`) are removed; a lone `<`/`>` used as
 * math or punctuation ("5 < 10 guests") is preserved. The loop collapses
 * malformed / nested payloads (e.g. `<<b>b>`) that a single pass would leave
 * partly formed.
 */
export function stripTags(input: string): string {
  let out = input;
  let prev: string;
  do {
    prev = out;
    out = out.replace(/<\/?[a-zA-Z][^>]*>/g, "");
  } while (out !== prev);
  return out.trim();
}
