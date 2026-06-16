import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  // Ouvir em IPv4 (127.0.0.1). Abrir sempre por http://127.0.0.1:5190/ — evita a
  // ambiguidade do "localhost", que no macOS resolve para IPv6 (::1) primeiro.
  // Porto fixo 5190 (strictPort) para não chocar com outra app no 5173/5174.
  server: { host: "127.0.0.1", port: 5190, strictPort: true },
  // Em dev, o Vite varre todos os .html da pasta como entradas para pré-empacotar
  // dependências. Há HTMLs/pastas-fonte soltos na raiz (com espaços e acentos) que
  // fazem o scanner abortar (ECANCELED) → dev server não serve nada → ecrã branco.
  // Limitar a varredura ao index.html resolve. (O build já só usa o index.html.)
  optimizeDeps: { entries: ["index.html"] },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "MedGuia",
        short_name: "MedGuia",
        description: "Guia de bolso de estudo clínico",
        lang: "pt",
        theme_color: "#2d8a4e",
        background_color: "#f5f5f0",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2,mjs}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@conteudo": fileURLToPath(new URL("./conteudo", import.meta.url)),
    },
  },
});
