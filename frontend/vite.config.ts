import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/chat": "http://localhost:8787",
      "/state": "http://localhost:8787",
      "/reset": "http://localhost:8787",
      "/telegram": "http://localhost:8787",
      "/profile": "http://localhost:8787",
    },
  },
});
