import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

const PROJECT_ROOT = import.meta.dirname;

const plugins = [react(), tailwindcss()];

// Analise de bundle sob demanda: ANALYZE=1 pnpm build gera bundle-stats.html.
if (process.env.ANALYZE) {
  plugins.push(
    visualizer({
      filename: "bundle-stats.html",
      gzipSize: true,
      template: "treemap",
    }),
  );
}

export default defineConfig(({ command, mode }) => {
  const envDir = path.resolve(PROJECT_ROOT);

  return {
    plugins: command === "serve" ? [...plugins, jsxLocPlugin()] : plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir,
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: "http://localhost:3100",
          changeOrigin: true,
        },
      },
      strictPort: false, // Will find next available port if 3000 is busy
      host: true,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        // Túneis (ngrok, etc.): cobre *.ngrok-free.app e variantes
        ".ngrok-free.app",
        ".ngrok-free.dev",
        ".ngrok.io",
        ".ngrok.app",
        ".ngrok.dev",
      ],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
