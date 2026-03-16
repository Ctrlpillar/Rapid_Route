import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Added dot for standard pathing
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false, // Set to false for production to keep build size small
  },
  server: {
    port: 5173,
    host: true, // Changed from 'localhost' to true to allow network access (useful for testing on mobile)
    strictPort: false,
  },
  preview: {
    port: 4173,
    host: true,
  },
});