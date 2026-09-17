import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("react-router")) {
            return "vendor-react";
          }
          if (id.includes("gsap") || id.includes("@gsap")) {
            return "vendor-gsap";
          }
          if (id.includes("@supabase")) {
            return "vendor-supabase";
          }
          if (id.includes("lenis")) {
            return "vendor-lenis";
          }
        },
      },
    },
  },
});
