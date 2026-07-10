import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

// Config dedicada de testes — NÃO herda o `root: client/` do vite.config.ts.
// Replica exatamente os aliases do vite.config.ts (@, @shared, @assets).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  test: {
    environment: "jsdom",
    include: [
      "client/src/**/*.test.{ts,tsx}",
      "server/**/*.test.ts",
      "shared/**/*.test.ts",
    ],
    environmentMatchGlobs: [
      ["server/**", "node"],
      ["shared/**", "node"],
    ],
  },
});
