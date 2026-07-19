import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Preserve existing — required for Three.js R3F compatibility
  transpilePackages: ["three"],
  // Fix workspace root inference: prefer this project's root over user-level lockfiles
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
