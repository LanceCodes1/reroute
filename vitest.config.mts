import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true }, // makes the @/* alias resolve in tests (native Vite)
  test: {
    environment: "node", // pure logic tests; no browser needed
    include: ["src/**/*.test.ts"],
  },
});
