import { env } from "@/lib/env";

/**
 * Site-wide JSON-LD (Organization + WebSite w/ SearchAction) — rendered once
 * in the root layout. Per-page structured data (BreadcrumbList, Vehicle)
 * lives on the pages that actually have that context (search results,
 * vehicle detail).
 */
export function SiteJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kerala Lease Hub",
    url: env.SITE_URL,
    // Absolute URL, per Google's structured-data guidelines for the Logo
    // rich result / knowledge panel — a relative path won't be picked up.
    logo: `${env.SITE_URL}/branding/logo-footer.webp`,
    description: "Kerala's vehicle marketplace for buying, selling, and leasing used cars and bikes directly from owners.",
    areaServed: { "@type": "State", name: "Kerala" },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Kerala Lease Hub",
    url: env.SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${env.SITE_URL}/vehicles?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
