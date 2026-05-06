import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

const PROJECT_ROOT = import.meta.dirname;

const plugins = [react(), tailwindcss(), jsxLocPlugin()];

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(PROJECT_ROOT);
  const env = loadEnv(mode, envDir, "");
  const tunnelHost = env.VITE_DEV_TUNNEL_HOST?.replace(/^https?:\/\//, "").split("/")[0]?.trim();

  return {
    plugins,
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
      // HMR pelo HTTPS do túnel: em .env defina VITE_DEV_TUNNEL_HOST=seu-subdominio.ngrok-free.app
      ...(tunnelHost
        ? {
            hmr: {
              host: tunnelHost,
              protocol: "wss",
              clientPort: 443,
            },
          }
        : {}),
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
