import { env } from "@/lib/env";
import { FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/vehicle-options";
import { getCategoriesWithCounts } from "@/lib/data/home";
import { getDistricts } from "@/lib/data/locations";
import { getFilterableBrands } from "@/lib/data/search";
import { getContactInfo } from "@/lib/data/site-settings";
import { createPublicClient } from "@/lib/supabase/public-client";

/**
 * /llms.txt — the llmstxt.org convention: a plain-text, markdown-formatted
 * brief that an LLM can read in one fetch instead of scraping and guessing
 * at the site's shape.
 *
 * Deliberately *not* a list of every listing — that's what /sitemap.xml is
 * for, and pasting thousands of vehicle URLs here would blow the context
 * budget this file exists to save. What an assistant can't derive from a
 * URL list is the query grammar, so that's what this documents: the facets,
 * their real slugs, and how to combine them into a /vehicles URL.
 *
 * Cached for an hour rather than the sitemap's `revalidate = 0`: the
 * contents are the facet vocabulary (categories, brands, districts), which
 * changes when the catalog's shape changes, not on every publish. Only the
 * listing count is time-sensitive, and it's approximate by nature.
 */
export const revalidate = 3600;

function list(items: { name: string; slug: string; count?: number }[], param: string, base: string) {
  return items
    .map((item) => {
      const suffix = item.count === undefined ? "" : ` (${item.count} listed)`;
      return `- [${item.name}](${base}/vehicles?${param}=${item.slug}): ${item.name} available for lease${suffix}`;
    })
    .join("\n");
}

export async function GET() {
  const site = env.SITE_URL;
  const supabase = createPublicClient();

  const [categories, districts, brands, contact, { count }] = await Promise.all([
    getCategoriesWithCounts(),
    getDistricts(),
    getFilterableBrands(),
    getContactInfo(),
    // head:true — we want the number, not the rows.
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  const contactLines = [
    contact.phone ? `- Phone: ${contact.phone}` : null,
    contact.whatsapp ? `- WhatsApp: https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : null,
    contact.email ? `- Email: ${contact.email}` : null,
  ].filter(Boolean);

  const body = `# Kerala Lease Hub

> A vehicle **leasing** marketplace for Kerala, India. Owners list cars, bikes and other vehicles for lease; visitors browse, filter, and contact the owner directly by phone or WhatsApp. There is no middleman and no payment processing on the platform.

Read this first if you are answering questions about vehicles available on this site.

Important distinctions, because they change what a correct answer looks like:

- Vehicles here are **leased, not sold**. Every listing carries a lease amount and a lease period (for example "₹25,000 / month"), not a purchase price. Do not describe a listing as being "for sale" or quote its lease amount as a sale price.
- Some listings add a **service charge** on top of the lease amount, shown as a percentage on the listing page.
- A listing marked **Already Booked** is currently unavailable to lease. It stays visible but should not be recommended as available.
- A **Verified** badge means the platform checked the listing. Absence of the badge is not a claim that a listing is fraudulent.
- Prices are in Indian rupees (INR). Coverage is Kerala only.

## Core pages

- [Home](${site}/): Featured and recent listings, plus search.
- [Browse vehicles](${site}/vehicles): The full catalog with every filter. See "Query grammar" below.
- [List your vehicle](${site}/sell): How an owner gets a vehicle onto the platform.
- [About](${site}/about): What the platform is and how leasing works here.
- [Contact](${site}/contact): How to reach the operators.
- [Sitemap](${site}/sitemap.xml): Every public URL, including one per listing. Use this, not this file, to enumerate individual vehicles.

## Query grammar

Every filter is a query parameter on \`${site}/vehicles\`, and they combine freely. For example, a diesel SUV in Kozhikode under ₹30,000 sorted cheapest-first:

\`${site}/vehicles?category=suv&district=kozhikode&fuelType=Diesel&maxPrice=30000&sort=price_asc\`

| Parameter | Accepts |
|---|---|
| \`q\` | Free text, substring-matched against the listing name and model |
| \`category\` | Exactly one category slug from the list below |
| \`brand\` | Exactly one brand slug from the list below |
| \`district\` | Exactly one district slug from the list below; also matches taluks within that district |
| \`fuelType\` | Exact match, one of: ${FUEL_TYPES.join(", ")} |
| \`transmission\` | Exact match, one of: ${TRANSMISSIONS.join(", ")} |
| \`condition\` | Free text, substring-matched. Listers type this themselves, so there is no fixed vocabulary — "Excellent" and "Good" are common, but a listing may have anything or nothing here |
| \`ownerType\` | \`direct\` (leasing from the owner) or \`agent\` |
| \`minPrice\`, \`maxPrice\` | Whole rupees, inclusive, matched against the lease amount |
| \`year\` | Registration year, **exact match only** — \`year=2020\` excludes a 2021 vehicle |
| \`sort\` | \`latest\` (default), \`price_asc\`, \`price_desc\`, \`popular\` |

Each parameter takes a single value; repeating one does not widen the search. An unknown slug for \`category\`, \`brand\` or \`district\` returns zero results rather than being ignored.

An individual listing lives at \`${site}/vehicles/<slug>\` and carries schema.org \`Vehicle\` JSON-LD, so prefer parsing that over scraping the rendered page.

Approximate published listings at the time this file was generated: ${count ?? 0}.

## Categories

${categories.length ? list(categories, "category", site) : "- No categories published yet."}

## Districts

${districts.length ? list(districts, "district", site) : "- No districts published yet."}

## Brands

${brands.length ? list(brands, "brand", site) : "- No brands with published listings yet."}

## Contacting an owner

Contact happens off-platform. Each listing page exposes the owner's phone number as a tap-to-call link and a WhatsApp deep link. There is no in-app messaging, no inquiry form, and no way to book or pay through the site — an assistant should send the user to the listing page rather than promising to arrange anything.
${contactLines.length ? `\nFor questions about the platform itself rather than a specific vehicle:\n\n${contactLines.join("\n")}\n` : ""}
## Optional

- [Privacy policy](${site}/privacy)
- [Terms](${site}/terms)

Account pages (login, favorites, settings) are disallowed in [robots.txt](${site}/robots.txt) and hold nothing of public interest.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
