// Keyset (cursor) pagination helpers — see PERFORMANCE.md #4. A cursor
// encodes the sort column's value + a unique tiebreaker (id) from the last
// row of the previous page, so the next page can filter with
// `(sort_col, id) < (cursor.v, cursor.id)` instead of walking past an
// ever-growing OFFSET.
export type Cursor = { v: string; id: string };

export function encodeCursor(payload: Cursor): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

// Both callers (lib/data/search.ts, lib/data/favorites.ts) splice `v`/`id`
// directly into a hand-built PostgREST `.or()` filter string, so these two
// values are the only thing standing between a crafted `?cursor=` and
// injecting extra filter clauses (commas/parens are syntax in that
// grammar). Restricting to the only shapes a real cursor can ever take —
// an ISO timestamp or plain number for `v`, a UUID for `id` — rejects
// anything containing those characters before it reaches the query.
const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;
const NUMERIC_RE = /^-?\d+(?:\.\d+)?$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidCursorValue(value: string): boolean {
  return TIMESTAMP_RE.test(value) || NUMERIC_RE.test(value);
}

export function decodeCursor(cursor: string | null | undefined): Cursor | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof parsed?.v !== "string" || typeof parsed?.id !== "string") return null;
    if (!isValidCursorValue(parsed.v) || !UUID_RE.test(parsed.id)) return null;
    return parsed;
  } catch {
    return null;
  }
}
