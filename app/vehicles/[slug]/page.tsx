import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Phone } from "lucide-react";
import { getVehicleBySlug, getRelatedVehicles, incrementViewCount, formatOwnership } from "@/lib/data/vehicles";
import { createPublicClient } from "@/lib/supabase/public-client";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleDescription } from "@/components/vehicle-description";
import { FavoriteButton } from "@/components/favorite-button";
import { VehicleJsonLd } from "@/components/seo/vehicle-jsonld";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-jsonld";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

const BOOKED_TITLE = "This vehicle is already booked.";

/** Call/WhatsApp, in either their live (<a>) or genuinely-blocked (<button
 * disabled>) form — booked renders no href/onClick at all, not just a
 * disabled-looking link, so there's nothing for a click to fall through to. */
function ContactAction({
  href,
  icon,
  label,
  disabled,
  tone,
  external = false,
}: {
  href: string;
  icon?: ReactNode;
  label: string;
  disabled: boolean;
  tone: "primary" | "whatsapp";
  external?: boolean;
}) {
  const className = cn(
    "flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition",
    tone === "primary" ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-emerald-600 text-emerald-600 hover:bg-emerald-600/10",
    disabled && "pointer-events-none cursor-not-allowed opacity-50"
  );

  if (disabled) {
    return (
      <button type="button" disabled aria-disabled="true" title={BOOKED_TITLE} className={className}>
        {icon}
        {label}
      </button>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(className, "no-underline")}
    >
      {icon}
      {label}
    </a>
  );
}

export const revalidate = 120;

// Prerender every currently-published vehicle at build time so this route
// serves as static HTML from the CDN instead of rendering on every request
// (see PERFORMANCE.md). New vehicles published after a deploy still work —
// dynamicParams defaults to true, so an unseen slug renders on first
// request and is then cached for `revalidate` seconds like the rest.
export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("vehicles").select("slug").eq("status", "published");
  return (data ?? []).map((vehicle) => ({ slug: vehicle.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return { title: "Vehicle not found" };

  const district = vehicle.districtName ?? "Kerala";
  // Leads with "<vehicle> for Lease in <district>" — the phrase people
  // actually search ("Maruti Suzuki S-Cross for lease in Kerala"), not
  // just the bare model name + price. district (e.g. "Kollam"), not a
  // hardcoded "Kerala", so every listing's title stays distinct instead of
  // all reading the same repeated phrase — Kerala is still covered by the
  // site name, Organization schema's areaServed, and this same phrase
  // applies to whichever district a search happens to mention.
  const title = `${vehicle.name}${vehicle.registrationYear ? ` ${vehicle.registrationYear}` : ""} for Lease in ${district} — ₹${vehicle.leaseAmount.toLocaleString("en-IN")}`;
  // Ignored by Google (deprecated there since ~2009) but still read by
  // Bing and some other crawlers — cheap to include, matches what people
  // actually type ("<model> for lease", "<model> lease Kerala").
  const keywords = [
    `${vehicle.name} for lease`,
    `${vehicle.name} for lease in ${district}`,
    `lease ${vehicle.name} Kerala`,
    `${vehicle.name} rental Kerala`,
    vehicle.brandName ? `${vehicle.brandName} for lease Kerala` : null,
  ].filter((value): value is string => Boolean(value));

  // ---- Share-preview shape -------------------------------------------
  // WhatsApp is where listers actually share these, and the message they
  // send already spells out every spec — model, fuel, transmission, lease
  // amount, location, contact (see admin lib/vehicles/share.ts). A preview
  // card repeating the same facts underneath is pure duplication, so the
  // card is stripped to the photo and the shortest honest label.
  //
  // No description reaches the head at all, and that takes THREE deletions,
  // because each one alone leaves the sentence in the card:
  //   - openGraph.description — the tag WhatsApp reads first.
  //   - twitter.description — same, for the platforms that read that block.
  //   - the top-level `description`, explicitly null. Link-preview crawlers
  //     fall back to plain <meta name="description"> when og:description is
  //     absent, and null is what removes it: metadata fields this page
  //     doesn't set are INHERITED from app/layout.tsx (which does set a
  //     site-wide description), so merely omitting it would swap the
  //     listing's description for the site's, not remove it. Nested
  //     openGraph/twitter fields need no such null — a child that sets those
  //     objects replaces the parent's wholesale.
  //
  // The description a human reads is untouched: it's the real one in the
  // page body (<VehicleDescription />), not a meta tag. The SEO cost is
  // giving up a hand-written meta description — Google composes result
  // snippets from page content in most cases anyway, and title, canonical,
  // keywords and the Vehicle JSON-LD (price, mileage, condition) all stay.
  //
  // og:title is the bare vehicle name rather than the SEO `title` above:
  // WhatsApp always renders a title line, falling back to <title> when
  // og:title is absent, so an empty card isn't reachable — the shortest
  // identifying label is as close as it gets. <title> keeps the full
  // keyword-bearing phrase for search.
  //
  // The medium variant (1200px wide, see the admin upload route) is
  // preferred over the original (up to 1920px) as a hedge, not a fix: link
  // previews degrade to a tiny thumbnail — or nothing — once the image
  // exceeds the crawler's size cap, and medium bounds that across the whole
  // catalog. It changes nothing for a typical listing (a sampled original
  // measured 178KB against medium's 132KB — both comfortably under any cap),
  // so whether a given card renders large or compact stays WhatsApp's call,
  // not something these tags decide. Falls back to the original for listings
  // uploaded before variants existed (migration 0019).
  const coverMediumUrl = vehicle.images.find((image) => image.url === vehicle.coverImageUrl)?.mediumUrl;
  const previewImage = coverMediumUrl ?? vehicle.coverImageUrl;

  return {
    title,
    description: null,
    keywords,
    alternates: { canonical: `/vehicles/${vehicle.slug}` },
    openGraph: {
      title: vehicle.name,
      images: previewImage ? [{ url: previewImage, alt: vehicle.name }] : undefined,
      url: `${env.SITE_URL}/vehicles/${vehicle.slug}`,
    },
    twitter: { card: "summary_large_image", title: vehicle.name, images: previewImage ? [previewImage] : undefined },
  };
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  // Favorited state resolves client-side (FavoritesProvider) so this page
  // stays free of cookies()-dependent calls and can be statically rendered
  // — see PERFORMANCE.md.
  void incrementViewCount(vehicle.id);

  const relatedVehicles = await getRelatedVehicles(
    { id: vehicle.id, brandId: vehicle.brandId, locationId: vehicle.locationId, categoryId: vehicle.categoryId },
    8
  );

  const isBooked = vehicle.bookingStatus === "booked";
  const phoneDigits = vehicle.contactPhone.replace(/\D/g, "");
  const whatsappNumber = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;

  // Pre-fills the owner's chat with the listing link and key details instead
  // of opening to a blank conversation — the owner sees at a glance which
  // vehicle the enquiry is about without the lessee having to type it out.
  const vehicleUrl = `${env.SITE_URL}/vehicles/${vehicle.slug}`;
  const enquiryMessage = [
    `Hi, I'm interested in leasing your ${vehicle.name}${vehicle.registrationYear ? ` (${vehicle.registrationYear})` : ""}.`,
    `₹${vehicle.leaseAmount.toLocaleString("en-IN")} / ${vehicle.leasePeriod}`,
    vehicleUrl,
  ].join("\n");
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(enquiryMessage)}`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: env.SITE_URL },
          { name: "Vehicles", url: `${env.SITE_URL}/vehicles` },
          { name: vehicle.name, url: `${env.SITE_URL}/vehicles/${vehicle.slug}` },
        ]}
      />
      <VehicleJsonLd vehicle={vehicle} />
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <VehicleGallery images={vehicle.images} name={vehicle.name} vehicleId={vehicle.id} slug={vehicle.slug} isBooked={isBooked} />

            {/* Mobile/tablet: contact CTAs surface right under the gallery
                instead of being buried below the full spec sheet. */}
            <div className="glass-surface glass-specular space-y-3 rounded-(--glass-radius-lg) p-4 lg:hidden">
              <div>
                <p className="text-2xl font-bold">
                  ₹{vehicle.leaseAmount.toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-muted-foreground"> / {vehicle.leasePeriod}</span>
                </p>
                {/* Sits with the price, not in the spec grid — it's money the
                    lessee pays, not a property of the vehicle. */}
                {vehicle.serviceChargePercent ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">+ {vehicle.serviceChargePercent}% service charge</p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ContactAction href={`tel:${phoneDigits}`} icon={<Phone className="size-4" />} label="Call" disabled={isBooked} tone="primary" />
                <ContactAction href={whatsappHref} label="WhatsApp" disabled={isBooked} tone="whatsapp" external />
              </div>
              <FavoriteButton
                vehicleId={vehicle.id}
                label="Save to favorites"
                disabled={isBooked}
                className="w-full rounded-full"
              />
            </div>

            <div className="glass-surface rounded-(--glass-radius-lg) p-6">
              <h1 className="text-2xl font-bold tracking-wide uppercase">{vehicle.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" /> {vehicle.districtName ?? "Kerala"}
                </span>
                {isBooked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-medium text-white">Already Booked</span>
                ) : null}
                {vehicle.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    <BadgeCheck className="size-3.5" /> Verified
                  </span>
                ) : null}
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-3">
                {[
                  ["Year", vehicle.registrationYear],
                  ["Fuel type", vehicle.fuelType],
                  ["Transmission", vehicle.transmission],
                  ["Ownership", formatOwnership(vehicle.ownershipCount)],
                  ["KM driven", vehicle.kmDriven != null ? `${vehicle.kmDriven.toLocaleString("en-IN")} km` : null],
                  ["Condition", vehicle.condition],
                  ["Engine", vehicle.engineCapacity],
                  ["Color", vehicle.color],
                  ["Seats", vehicle.seats],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label as string}>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                      <dd className="mt-1 text-sm font-medium">{value}</dd>
                    </div>
                  ))}
              </dl>

              {vehicle.features.length > 0 ? (
                <div className="mt-6">
                  <h2 className="text-sm font-semibold">Features</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {vehicle.features.map((feature) => (
                      <span key={feature} className="rounded-full bg-muted px-3 py-1 text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {vehicle.description ? (
                <div className="mt-6">
                  <h2 className="text-sm font-semibold">Description</h2>
                  <div className="mt-2">
                    <VehicleDescription description={vehicle.description} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="hidden space-y-4 lg:block">
            <div className="glass-surface glass-specular rounded-(--glass-radius-lg) p-6 lg:sticky lg:top-6">
              <p className="text-3xl font-bold">
                ₹{vehicle.leaseAmount.toLocaleString("en-IN")}
                <span className="text-sm font-normal text-muted-foreground"> / {vehicle.leasePeriod}</span>
              </p>
              {/* Sits with the price, not in the spec grid — it's money the
                  lessee pays, not a property of the vehicle. */}
              {vehicle.serviceChargePercent ? (
                <p className="mt-1 text-xs text-muted-foreground">+ {vehicle.serviceChargePercent}% service charge</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {vehicle.directOwner ? "Listed by direct owner — no broker fees." : "Listed via agent."}
              </p>

              <div className="mt-6 space-y-2">
                <ContactAction href={`tel:${phoneDigits}`} icon={<Phone className="size-4" />} label="Call owner" disabled={isBooked} tone="primary" />
                <ContactAction href={whatsappHref} label="WhatsApp owner" disabled={isBooked} tone="whatsapp" external />
                <FavoriteButton
                  vehicleId={vehicle.id}
                  label="Save to favorites"
                  disabled={isBooked}
                  className="w-full rounded-full"
                />
              </div>

              <p className="mt-4 text-xs text-muted-foreground">{vehicle.viewCount.toLocaleString("en-IN")} views</p>
            </div>
          </aside>
        </div>

        {relatedVehicles.length > 0 ? (
          <section className="mt-10 sm:mt-12" aria-labelledby="related-vehicles-heading">
            <h2 id="related-vehicles-heading" className="text-xl font-semibold sm:text-2xl">
              Similar vehicles
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {relatedVehicles.map((related) => (
                <VehicleCard key={related.id} vehicle={related} imageSizes="(max-width: 1024px) 50vw, 25vw" />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
