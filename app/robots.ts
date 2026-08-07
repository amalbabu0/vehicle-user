import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/auth/callback"],
    },
    sitemap: `${env.SITE_URL}/sitemap.xml`,
  };
}
