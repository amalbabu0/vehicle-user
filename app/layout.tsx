import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteJsonLd } from "@/components/seo/site-jsonld";
import { env } from "@/lib/env";

const GA_MEASUREMENT_ID = "G-KYY8FG24P2";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const SITE_NAME = "Kerala Lease Hub";
const SITE_DESCRIPTION =
  "Kerala's dedicated vehicle leasing platform — lease cars, bikes, and every kind of vehicle directly from verified owners across Kerala. No hidden charges, direct contact, fast listing approval.";

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: {
    default: `${SITE_NAME} — Lease Cars, Bikes & All Vehicles in Kerala`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "vehicle leasing Kerala", "lease a car Kerala", "lease a bike Kerala", "car leasing Kerala",
    "bike leasing Kerala", "Kerala vehicle lease platform", "lease vehicles Kerala", "Kerala Lease Hub",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Lease Cars, Bikes & All Vehicles in Kerala`,
    description: SITE_DESCRIPTION,
    url: env.SITE_URL,
    locale: "en_IN",
    // Default share-preview image for any page that doesn't set its own
    // (vehicle detail pages already override this with the listing's cover
    // photo — see app/vehicles/[slug]/page.tsx's generateMetadata).
    images: [{ url: "/branding/logo-footer.webp", width: 676, height: 369, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Lease Cars, Bikes & All Vehicles in Kerala`,
    description: SITE_DESCRIPTION,
    images: ["/branding/logo-footer.webp"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <SiteJsonLd />
        {/* Google tag (gtag.js) — plain <script> tags, deliberately NOT
            next/script. Verified directly against the deployed site (curl
            + inspecting the actual built HTML): next/script always routes
            through Next.js's internal loader shim (the __next_s array
            push pattern) regardless of strategy — beforeInteractive vs
            afterInteractive only changes *when* it runs relative to
            hydration, neither ever emits the literal
            <script src="https://www.googletagmanager.com/gtag/js?...">
            tag a simple HTML-scanning verifier (like Google's own "tag not
            detected" quick-check) looks for. A real browser executes
            either form fine, but plain tags are what actually get
            detected by that check. Same raw-<script>-via-
            dangerouslySetInnerHTML pattern already used for JSON-LD
            elsewhere in this app (see components/seo/*). */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`,
          }}
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
