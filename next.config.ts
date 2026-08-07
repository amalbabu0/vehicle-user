import type { NextConfig } from "next";

const imagesCdnHostname = process.env.IMAGES_CDN_URL
  ? new URL(process.env.IMAGES_CDN_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: imagesCdnHostname
      ? [{ protocol: "https", hostname: imagesCdnHostname }]
      : [],
    formats: ["image/avif", "image/webp"],
  },
  // Standard security-header baseline. HTTPS/SSL itself is handled at the
  // hosting platform level (Vercel), not here. Not attempting a full
  // Content-Security-Policy — that needs auditing every external resource
  // this app loads (Turnstile, Vercel Analytics, R2 image CDN, Supabase)
  // to avoid breaking them, which is a bigger, separate piece of work.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
