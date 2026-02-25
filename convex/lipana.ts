import { action } from "./_generated/server";
import { v } from "convex/values";

const LIPANA_BASE_URL = "https://api.lipana.dev/v1";

function getLipanaSecretKey() {
  const raw = process.env.LIPANA_SECRET_KEY;
  let key = typeof raw === "string" ? raw : "";
  // Remove newlines that sometimes sneak in via copy/paste or env tooling
  key = key.replace(/[\r\n]/g, "").trim();
  if (!key) {
    throw new Error("Missing LIPANA_SECRET_KEY env var");
  }
  if (/^['"]/.test(key) || /['"]$/.test(key)) {  // disallow surrounding quotes

    throw new Error("Invalid LIPANA_SECRET_KEY (remove surrounding quotes)");
  }
  return key;
}

async function lipanaFetch(path: string, init: RequestInit) {
  const url = `${LIPANA_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const apiKey = getLipanaSecretKey();
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Primary auth method (per docs)
      "x-api-key": apiKey,
      // Secondary auth method (some endpoints may require it)
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-json response
  }

  if (!res.ok) {
    const message = json?.message ?? json?.error ?? text ?? `Lipana request failed (${res.status})`;
    throw new Error(`Lipana request failed (${res.status}) ${res.statusText}: ${message}`);
  }

  return json;
}

export const createPaymentLink = action({
  args: {
    title: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (_ctx, args) => {
    const payload: any = {
      title: args.title,
      amount: args.amount,
      currency: args.currency ?? "KES",
    };

    // If Lipana supports metadata, include it. (Harmless if ignored.)
    if (args.metadata !== undefined) payload.metadata = args.metadata;

    const data = await lipanaFetch("/payment-links", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // We intentionally accept multiple shapes to be robust against API changes.
    const id =
      data?.id ??
      data?.data?._id ??
      data?.data?.id ??
      data?.payment_link?._id ??
      data?.payment_link?.id ??
      data?.paymentLink?._id ??
      data?.paymentLink?.id ??
      data?.paymentLinkId ??
      data?.reference ??
      data?.checkout?.id;

    const slug =
      data?.slug ??
      data?.data?.slug ??
      data?.payment_link?.slug ??
      data?.paymentLink?.slug;

    let url =
      data?.url ??
      data?.data?.url ??
      data?.payment_link?.url ??
      data?.checkout_url ??
      data?.checkoutUrl ??
      data?.paymentLink?.url ??
      data?.payment_link_url ??
      data?.checkout?.url;

    // If Lipana doesn't return an explicit URL but we have a slug, generate a hosted checkout URL.
    if (!url && slug) {
      url = `https://lipana.dev/pay/${encodeURIComponent(String(slug))}`;
    }

    // Some Lipana responses return the id but not the final checkout URL on create.
    // In that case, do a follow-up GET to fetch the full resource and try again.
    if (id && !url) {
      const details = await lipanaFetch(`/payment-links/${encodeURIComponent(String(id))}`, {
        method: "GET",
      });

      url =
        details?.url ??
        details?.data?.url ??
        details?.payment_link?.url ??
        details?.checkout_url ??
        details?.checkoutUrl ??
        details?.paymentLink?.url ??
        details?.payment_link_url ??
        details?.checkout?.url;

      const detailsSlug = details?.slug ?? details?.data?.slug ?? details?.payment_link?.slug;
      if (!url && (detailsSlug ?? slug)) {
        url = `https://lipana.dev/pay/${encodeURIComponent(String(detailsSlug ?? slug))}`;
      }

      return { id: String(id), url: String(url ?? ""), raw: data, detailsRaw: details };
    }

    if (!id || !url) {
      const safe = (() => {
        try {
          return JSON.stringify(data);
        } catch {
          return String(data);
        }
      })();
      throw new Error(`Unexpected Lipana response: missing payment link id/url. Raw=${safe}`);
    }

    return { id: String(id), url: String(url), raw: data };
  },
});

export const initiateStkPush = action({
  args: { phone: v.string(), amount: v.number() },
  handler: async (_ctx, args) => {
    const data = await lipanaFetch("/transactions/push-stk", {
      method: "POST",
      body: JSON.stringify({ phone: args.phone, amount: args.amount }),
    });

    const transactionId = data?.data?.transactionId ?? data?.transactionId ?? data?.id;
    const checkoutRequestID = data?.data?.checkoutRequestID ?? data?.data?.checkoutRequestId;
    const status = data?.data?.status ?? data?.status;

    if (!transactionId) {
      throw new Error(`Unexpected Lipana STK response: ${JSON.stringify(data)}`);
    }

    return { transactionId: String(transactionId), checkoutRequestID, status, raw: data };
  },
});

export const getTransaction = action({
  args: { transactionId: v.string() },
  handler: async (_ctx, args) => {
    // Primary: GET /transactions/:id
    try {
      const data = await lipanaFetch(`/transactions/${encodeURIComponent(args.transactionId)}`, {
        method: "GET",
      });
      return { raw: data };
    } catch (e: any) {
      // Fallback: some APIs only support listing and filtering.
      const list = await lipanaFetch(`/transactions?limit=50`, {
        method: "GET",
      });
      return { raw: list, lookupFailed: e?.message ?? String(e) };
    }
  },
});

export const getPaymentLink = action({
  args: {
    paymentLinkId: v.string(),
  },
  handler: async (_ctx, args) => {
    // Many providers expose GET /payment-links/:id; implement that first.
    // If Lipana uses a different endpoint, we can adjust once you share the exact docs.
    const data = await lipanaFetch(`/payment-links/${encodeURIComponent(args.paymentLinkId)}`, {
      method: "GET",
    });

    return { raw: data };
  },
});
