import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["__tests__/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // Next resolves "server-only" to empty.js via the react-server export
      // condition. Vitest resolves the default entry, which throws on import.
      // Point it at the same empty module so server-side units are testable.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
});
