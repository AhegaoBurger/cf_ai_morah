import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/chat": "http://localhost:8787",
      "/state": "http://localhost:8787",
      "/reset": "http://localhost:8787",
      "/telegram": "http://localhost:8787",
    },
  },
});
