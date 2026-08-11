import type { Metadata } from "next";
import { env } from "@/lib/env";

const SITE_NAME = "Kerala Lease Hub";

/** Next.js metadata merging is shallow: a segment that sets `title` but not
 * `openGraph` doesn't get its title reflected into the inherited
 * `openGraph.title` — it inherits the root layout's openGraph object
 * wholesale (title/description/images and all), unrelated to this page.
 * Every static page's metadata should call this so shared links (WhatsApp,
 * social) preview the actual page instead of the homepage default. */
export function buildPageOg({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const fullTitle = `${title} | ${SITE_NAME}`;
  return {
    openGraph: {
      title: fullTitle,
      description,
      url: `${env.SITE_URL}${path}`,
      images: [{ url: "/branding/logo-footer.webp", width: 676, height: 369, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/branding/logo-footer.webp"],
    },
  };
}
