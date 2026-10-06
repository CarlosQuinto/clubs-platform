import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import {
  PLATFORM_NAME,
  PLATFORM_SHORT_NAME,
  PLATFORM_DESCRIPTION,
} from "./src/domains/clubs/clubDefaults";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // El registro vive en src/main.tsx (virtual:pwa-register): con ese import el plugin ya no inyecta
      // registerSW.js. skipWaiting + clientsClaim explícitos: el SW nuevo toma el control al instante y
      // el registro recarga la pestaña una vez (con `injectRegister: false` el plugin los desactivaría).
      workbox: { skipWaiting: true, clientsClaim: true },
      includeAssets: ["icon.svg"],
      manifest: {
        // Personaliza estos valores en src/domains/clubs/clubDefaults.ts
        name: PLATFORM_NAME,
        short_name: PLATFORM_SHORT_NAME,
        description: PLATFORM_DESCRIPTION,
        lang: "es",
        theme_color: "#102a43",
        background_color: "#f8fafc",
        display: "standalone",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    chunkSizeWarningLimit: 1000, // Sube el límite de advertencia a 1 MB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separa las librerías de terceros (React, Firebase) en su propio archivo caché
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
