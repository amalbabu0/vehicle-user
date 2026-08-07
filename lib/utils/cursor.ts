// Keyset (cursor) pagination helpers — see PERFORMANCE.md #4. A cursor
// encodes the sort column's value + a unique tiebreaker (id) from the last
// row of the previous page, so the next page can filter with
// `(sort_col, id) < (cursor.v, cursor.id)` instead of walking past an
// ever-growing OFFSET.
export type Cursor = { v: string; id: string };

export function encodeCursor(payload: Cursor): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCursor(cursor: string | null | undefined): Cursor | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof parsed?.v !== "string" || typeof parsed?.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
