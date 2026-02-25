import { createRoot } from "react-dom/client";
import { ConvexProvider } from "convex/react";
import App from "./App.tsx";
import { convex, convexUrl, rawConvexUrl } from "./lib/convex";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

if (!convex || !convexUrl) {
  // Render a clear error instead of a blank page.
  createRoot(rootEl).render(
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Site configuration error</h1>
      <p style={{ marginBottom: 12 }}>
        Invalid <code>VITE_CONVEX_URL</code>. It must be an absolute URL like <code>https://your-deployment.convex.cloud</code>.
      </p>
      <p style={{ marginBottom: 12, color: "#666" }}>
        Current value: <code>{String(rawConvexUrl ?? "(not set)")}</code>
      </p>
      <ol style={{ lineHeight: 1.6 }}>
        <li>Go to Vercel Project Settings → Environment Variables</li>
        <li>Add <code>VITE_CONVEX_URL</code> (Production + Preview)</li>
        <li>Redeploy</li>
      </ol>
    </div>
  );
} else {
  createRoot(rootEl).render(
    <ConvexProvider client={convex}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConvexProvider>
  );
}
