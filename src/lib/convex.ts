import { ConvexReactClient } from "convex/react";

function normalizeConvexUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  // Common misconfig: "my-deployment.convex.cloud" (missing protocol)
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const u = new URL(withProtocol);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export const rawConvexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
export const convexUrl = normalizeConvexUrl(rawConvexUrl);

// IMPORTANT:
// Do not throw at module load time. If the URL is missing/invalid in production,
// the whole app becomes a white screen. We handle it in `main.tsx` instead.
export const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;
