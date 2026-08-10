import type { Metadata } from "next";
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

  const title = `${vehicle.name} ${vehicle.registrationYear ?? ""} — ₹${vehicle.leaseAmount.toLocaleString("en-IN")}`.trim();
  const description = `${vehicle.name} in ${vehicle.districtName ?? "Kerala"} — ${[vehicle.fuelType, vehicle.transmission, vehicle.kmDriven ? `${vehicle.kmDriven.toLocaleString("en-IN")} km` : null].filter(Boolean).join(", ")}. Contact the owner directly on Kerala Lease Hub.`;

  return {
    title,
    description,
    alternates: { canonical: `/vehicles/${vehicle.slug}` },
    openGraph: { title, description, images: vehicle.coverImageUrl ? [vehicle.coverImageUrl] : undefined, url: `${env.SITE_URL}/vehicles/${vehicle.slug}` },
    twitter: { card: "summary_large_image", title, description },
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

  const relatedVehicles = await getRelatedVehicles({ id: vehicle.id, brandId: vehicle.brandId, locationId: vehicle.locationId }, 8);

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
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <VehicleGallery images={vehicle.images} name={vehicle.name} />

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
                <a
                  href={`tel:${phoneDigits}`}
                  className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground no-underline transition hover:opacity-90"
                >
                  <Phone className="size-4" /> Call
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full border border-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-600 no-underline transition hover:bg-emerald-600/10"
                >
                  WhatsApp
                </a>
              </div>
              <FavoriteButton
                vehicleId={vehicle.id}
                label="Save to favorites"
                className="w-full rounded-full"
              />
            </div>

            <div className="glass-surface rounded-(--glass-radius-lg) p-6">
              <h1 className="text-2xl font-bold tracking-wide uppercase">{vehicle.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" /> {vehicle.districtName ?? "Kerala"}
                </span>
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
                <a
                  href={`tel:${phoneDigits}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground no-underline transition hover:opacity-90"
                >
                  <Phone className="size-4" /> Call owner
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-600 no-underline transition hover:bg-emerald-600/10"
                >
                  WhatsApp owner
                </a>
                <FavoriteButton
                  vehicleId={vehicle.id}
                  label="Save to favorites"
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
                <VehicleCard key={related.id} vehicle={related} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
