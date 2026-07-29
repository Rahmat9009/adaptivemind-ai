import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Preserve existing — required for Three.js R3F compatibility
  transpilePackages: ["three"],
  // Keep Node-only ingestion libraries out of webpack's server bundle.
  serverExternalPackages: [
    "cheerio",
    "fast-xml-parser",
    "jszip",
    "mammoth",
    "pdf-parse",
    "pdfjs-dist",
  ],
  // Fix local workspace inference without conflicting with Vercel's tracing root.
  ...(process.env.VERCEL
    ? {}
    : {
        turbopack: {
          root: path.resolve(__dirname),
        },
      }),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), geolocation=(), microphone=(self), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
