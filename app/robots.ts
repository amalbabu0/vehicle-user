import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private, per-account pages with no public SEO value — crawling them
      // wastes crawl budget and their thin/duplicate-shell content can drag
      // down how Google evaluates the rest of the site.
      disallow: [
        "/api/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/auth/callback",
        "/favorites", "/settings", "/complete-profile", "/accountt-verifed",
      ],
    },
    sitemap: `${env.SITE_URL}/sitemap.xml`,
  };
}
