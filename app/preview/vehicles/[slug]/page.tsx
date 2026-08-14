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

/** Duplicated rather than imported: app/layout.tsx keeps its SITE_NAME
 * private, and this route deliberately shares none of that file's metadata —
 * importing it would invite someone to pull the site description along with
 * it, which is exactly what this page exists to keep out. */
const SITE_NAME = "Kerala Lease Hub";

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
    // The site name, not the vehicle's — and NOT nothing, which is what this
    // tried first and had to be walked back.
    //
    // Open Graph treats og:title, og:type, og:image and og:url as a required
    // set. Serving og:image alone left an incomplete graph, and WhatsApp
    // responded by discarding it and rendering no card whatsoever — the photo
    // disappeared along with the text. A card needs a label to exist at all,
    // so the question is only which label, and the site name carries no
    // model, year, price, or location.
    //
    // `absolute` matters: a plain string here would run through
    // app/layout.tsx's `title.template` and come back as
    // "Kerala Lease Hub | Kerala Lease Hub".
    title: { absolute: SITE_NAME },
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
    // og:type is set explicitly for the same reason as og:title: it's part of
    // the required set, and a child openGraph block replaces the parent's
    // wholesale, so app/layout.tsx's `type: "website"` does NOT carry over
    // here. Leaving it out was half of why the card vanished.
    //
    // og:description stays absent — that's the whole point of this route, and
    // it isn't one of the required properties. og:image:alt stays too: it
    // isn't rendered as card text, and dropping it would only cost
    // screen-reader users the description of the photo.
    openGraph: {
      type: "website",
      title: SITE_NAME,
      url: canonicalUrl,
      images: previewImage ? [{ url: previewImage, alt: vehicle.name }] : undefined,
    },
    twitter: { card: "summary_large_image", title: SITE_NAME, images: previewImage ? [previewImage] : undefined },
  };
}

/**
 * A bare link, and deliberately no vehicle name or heading anywhere in the
 * body: with <title> emptied above, a crawler that wants a label has nothing
 * in the <head> to take, and some fall back to on-page text (an <h1>) next.
 * Leaving the name here would put it straight back on the card.
 *
 * It isn't an empty page purely as a safety net: if a User-Agent is ever
 * misclassified as WhatsApp, whoever lands here gets a way through to the
 * real listing instead of a blank screen.
 */
export default async function VehicleSharePreviewPage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <Link href={`/vehicles/${vehicle.slug}`} className="text-sm font-medium text-primary">
        View this listing on Kerala Lease Hub
      </Link>
    </main>
  );
}
