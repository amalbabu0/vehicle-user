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
};

export default nextConfig;
