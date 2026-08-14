import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicleBySlug } from "@/lib/data/vehicles";
import { env } from "@/lib/env";

/**
 * The WhatsApp-only face of a vehicle page.
 *
 * No human is routed here. proxy.ts rewrites requests for /vehicles/<slug>
 * to this route when — and only when — the User-Agent is WhatsApp's link
 * crawler; the visitor-facing URL never changes, and every other client
 * (browsers, Googlebot, Facebook, Telegram) still gets the real page with
 * its full title/description/OG set intact.
 *
 * Why it exists: a lister's share message already spells out every spec —
 * model, fuel, transmission, lease amount, location, contact (see the admin
 * app's lib/vehicles/share.ts) — so WhatsApp's preview card was printing the
 * same facts a second time directly underneath. This route drops the
 * description so the card is the photo plus a name.
 *
 * Why a separate route rather than trimming the tags on the real page: the
 * description is wanted everywhere else (search results, other platforms),
 * and the alternative — branching on User-Agent inside the vehicle page's
 * generateMetadata — would mean reading headers() there, which is a Dynamic
 * API. That would force /vehicles/[slug] to render fresh on every request
 * and silently kill its static generation. PERFORMANCE.md documents that
 * exact trap costing this site its caching once already, via the navbar's
 * cookie read; this keeps the fix off the hot path entirely.
 */

export const revalidate = 120;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return { title: "Vehicle not found", robots: { index: false, follow: false } };

  // The medium variant (1200px wide, see the admin upload route) rather than
  // the original (up to 1920px): link previews degrade to a tiny thumbnail —
  // or drop the image — once it exceeds the crawler's size cap, and medium
  // bounds that across the whole catalog. Falls back to the original for
  // listings uploaded before variants existed (admin migration 0019).
  const coverMediumUrl = vehicle.images.find((image) => image.url === vehicle.coverImageUrl)?.mediumUrl;
  const previewImage = coverMediumUrl ?? vehicle.coverImageUrl;
  const canonicalUrl = `${env.SITE_URL}/vehicles/${vehicle.slug}`;

  return {
    // The bare vehicle name, not the listing's SEO title: WhatsApp always
    // renders a title line, falling back to <title> when og:title is absent,
    // so a card with no text at all isn't reachable — the shortest
    // identifying label is as close as it gets.
    title: vehicle.name,
    // Explicitly null, not merely omitted. Crawlers fall back to plain
    // <meta name="description"> when og:description is missing, and metadata
    // this route doesn't set is INHERITED from app/layout.tsx, which defines
    // a site-wide description — so omitting it would substitute the site's
    // description rather than remove it. openGraph/twitter need no such null:
    // a child that sets those objects replaces the parent's wholesale.
    description: null,
    // Belt and braces. Nothing links here and only WhatsApp is ever rewritten
    // to it, but a stray indexed copy of a listing under /preview would be a
    // duplicate of the real page — so it's noindex, pointing at the canonical.
    robots: { index: false, follow: false },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: vehicle.name,
      url: canonicalUrl,
      images: previewImage ? [{ url: previewImage, alt: vehicle.name }] : undefined,
    },
    twitter: { card: "summary_large_image", title: vehicle.name, images: previewImage ? [previewImage] : undefined },
  };
}

/**
 * Body content is nearly irrelevant — the crawler reads the <head> and stops.
 * It's a real link rather than an empty page purely as a safety net: if a
 * User-Agent is ever misclassified as WhatsApp, whoever lands here sees the
 * vehicle name and a way through to the actual listing instead of a blank
 * screen.
 */
export default async function VehicleSharePreviewPage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold">{vehicle.name}</h1>
      <Link href={`/vehicles/${vehicle.slug}`} className="text-sm font-medium text-primary">
        View this listing on Kerala Lease Hub
      </Link>
    </main>
  );
}
