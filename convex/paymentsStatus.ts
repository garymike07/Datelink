import { action, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";

function normalizeStatus(raw: any): string | null {
  const candidates = [raw?.status, raw?.data?.status, raw?.payment_link?.status, raw?.payment?.status];
  const found = candidates.find((s) => typeof s === "string" && s.trim().length > 0);
  return found ? String(found).toLowerCase() : null;
}

function isFailed(status: string | null) {
  return !!status && ["failed", "cancelled", "canceled", "expired"].includes(status);
}

export const getPayment = query({
  args: { paymentId: v.id("payments"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.paymentId);
    if (!p) throw new Error("Payment not found");
    if (p.userId !== args.userId) throw new Error("Unauthorized");
    return p;
  },
});

// Poll from the client. This will check Lipana server-side and finalize the payment if needed.
export const refreshPaymentStatus = action({
  args: { paymentId: v.id("payments"), userId: v.id("users") },
  handler: async (
    ctx,
    args
  ): Promise<{ status: string; providerStatus?: string | null; expiresInMs?: number }> => {
    const payment = (await ctx.runQuery(api.paymentsStatus.getPayment, args)) as any;

    // If already terminal, return quickly.
    if (payment.status === "completed" || payment.status === "failed") {
      return { status: payment.status };
    }

    // Enforce a 3-minute verification window.
    const createdAt = typeof payment.createdAt === "number" ? payment.createdAt : Date.now();
    const elapsed = Date.now() - createdAt;
    const timeoutMs = 3 * 60 * 1000;
    const expiresInMs = Math.max(timeoutMs - elapsed, 0);

    const transactionId = (payment.metadata as any)?.lipana?.stk?.transactionId ?? payment.transactionId;
    if (!transactionId) {
      throw new Error("Missing Lipana transaction id");
    }

    let raw: any;
    try {
      ({ raw } = (await ctx.runAction(api.lipana.getTransaction, { transactionId })) as any);
    } catch (e: any) {
      // Transient provider errors: keep pending and let the client keep polling.
      return { status: payment.status, providerStatus: "provider_error", expiresInMs } as const;
    }

    // If getTransaction returned a list, try to find our transaction in it.
    if (Array.isArray(raw)) {
      const found = raw.find((t: any) => String(t?.id ?? t?._id ?? t?.transactionId ?? "") === String(transactionId));
      raw = found ?? raw;
    } else if (Array.isArray(raw?.data)) {
      const found = raw.data.find((t: any) => String(t?.id ?? t?._id ?? t?.transactionId ?? "") === String(transactionId));
      raw = found ?? raw;
    }

    const status = normalizeStatus(raw);

    // For transactions, status is expected to be pending/success/failed
    if (status && ["success", "successful", "paid", "completed"].includes(status)) {
      await ctx.runMutation(internal.payments.finalizePaymentInternal, {
        paymentId: args.paymentId,
        userId: args.userId,
        success: true,
      });
      return { status: "completed", providerStatus: status, expiresInMs } as const;
    }

    if (isFailed(status)) {
      await ctx.runMutation(internal.payments.finalizePaymentInternal, {
        paymentId: args.paymentId,
        userId: args.userId,
        success: false,
      });
      return { status: "failed", providerStatus: status, expiresInMs } as const;
    }

    // If still pending and we've exceeded the timeout window, mark as failed.
    if (expiresInMs === 0) {
      await ctx.runMutation(internal.payments.finalizePaymentInternal, {
        paymentId: args.paymentId,
        userId: args.userId,
        success: false,
      });
      return { status: "failed", providerStatus: status, expiresInMs } as const;
    }

    return { status: payment.status, providerStatus: status, expiresInMs } as const;
  },
});
