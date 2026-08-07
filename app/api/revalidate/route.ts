import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";

/** Called by the admin app right after a vehicle's status changes, so a
 * published/archived/sold vehicle shows up correctly without waiting out
 * the page's `revalidate` window. Authenticated by a shared secret header,
 * not a user session — this is app-to-app, not browser-to-server. */
export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  if (secret !== env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug : null;

  if (slug) revalidatePath(`/vehicles/${slug}`);
  revalidatePath("/");
  // A listing's status change (publish/withdraw/delete) changes which
  // vehicles belong in the sitemap, so bust it on every call rather than
  // only waiting out its own revalidate window (see app/sitemap.ts).
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ revalidated: true, slug });
}
