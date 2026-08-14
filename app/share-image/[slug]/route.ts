import { NextResponse } from "next/server";
import sharp from "sharp";
import { getVehicleBySlug } from "@/lib/data/vehicles";

/**
 * A square (1:1) version of a listing's cover photo, generated on request,
 * for link-preview cards only — see app/preview/vehicles/[slug].
 *
 * Why this exists: listers shoot on phones, so covers are portrait (the one
 * this was built against is 899x1599, 9:16). WhatsApp fits that into its own
 * card shape, which is what made the shared card look nothing like the square
 * images listers post by hand in the channel. The stored variants can't fix
 * it: `-medium` keeps the source aspect, and `-thumb` is square but uses
 * `fit: "contain"`, so a portrait photo lands in a narrow band between wide
 * grey bars (see the admin upload route).
 *
 * Why on demand rather than a fourth upload variant: a new variant would only
 * cover listings uploaded after it shipped, leaving every existing listing
 * wrong until someone re-processed the whole bucket. This covers the catalog
 * as it stands today, and the result is cached at the CDN plus inside
 * WhatsApp, so the work happens roughly once per listing.
 *
 * `position: "attention"` rather than a centre crop: sharp picks the region
 * with the highest entropy, which on a portrait vehicle photo is the vehicle.
 * A centre crop on a 9:16 source slices a horizontal band out of the middle
 * and clips the roof — verified against a real listing before choosing this.
 *
 * JPEG, not WebP, despite the source being WebP and the rest of the site
 * serving WebP: this output exists solely for third-party crawlers, and JPEG
 * is the format every one of them handles. ~106KB at 1080x1080/q82, which
 * also sits well under the size ceiling where previews start degrading.
 */

const SIZE = 1080;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle?.coverImageUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const upstream = await fetch(vehicle.coverImageUrl, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);

    const square = await sharp(Buffer.from(await upstream.arrayBuffer()))
      .resize(SIZE, SIZE, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return new NextResponse(new Uint8Array(square), {
      headers: {
        "Content-Type": "image/jpeg",
        // Not `immutable`: the slug outlives the photo, so a lister swapping
        // the cover has to be able to win eventually. A day at the CDN with a
        // week of stale-while-revalidate keeps the crop essentially free
        // without pinning a replaced photo forever.
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    // A crawler that gets an error here shows no image at all — and an
    // unsquare photo beats a blank card, so fall back to the stored cover
    // rather than surfacing the failure.
    return NextResponse.redirect(vehicle.coverImageUrl, 302);
  }
}
