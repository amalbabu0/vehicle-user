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
  "Kerala's trusted vehicle marketplace — buy, sell, and lease used cars and bikes directly from verified owners. No hidden charges, direct contact, fast listing approval.";

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: {
    default: `${SITE_NAME} — Buy, Sell & Lease Used Cars & Bikes in Kerala`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "used cars Kerala", "buy used cars Kerala", "sell used cars Kerala", "used bikes Kerala",
    "Kerala vehicle marketplace", "second hand cars", "second hand bikes", "Kerala Lease Hub",
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
    title: `${SITE_NAME} — Buy, Sell & Lease Used Cars & Bikes in Kerala`,
    description: SITE_DESCRIPTION,
    url: env.SITE_URL,
    locale: "en_IN",
    // Default share-preview image for any page that doesn't set its own
    // (vehicle detail pages already override this with the listing's cover
    // photo — see app/vehicles/[slug]/page.tsx's generateMetadata).
    images: [{ url: "/branding/logo-footer.webp", width: 480, height: 135, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Buy, Sell & Lease Used Cars & Bikes in Kerala`,
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
