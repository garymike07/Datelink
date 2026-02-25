import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  optimizeDeps: {
    // Allow Vite to discover and prebundle deps to avoid a large number of
    // /node_modules/* requests in dev (which can trigger ERR_INSUFFICIENT_RESOURCES).
    noDiscovery: false,
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom/client",
      "use-sync-external-store",
      "use-sync-external-store/shim",
      "lucide-react",
      "framer-motion",
      "motion-dom",
      "react-remove-scroll",
      "tslib",
      "date-fns",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
    esbuildOptions: {
      mainFields: ["module", "main"],
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    dedupe: ["react", "react-dom", "use-sync-external-store"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
