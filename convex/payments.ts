import { action, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { insertNotification } from "./notifications";
import { api, internal } from "./_generated/api";

function normalizeKenyanPhone(input: string) {
  let phone = String(input ?? "").trim().replace(/\s+/g, "");
  // Allow common local formats: 0712345678 / 712345678
  if (phone.startsWith("0") && phone.length === 10) {
    phone = "+254" + phone.slice(1);
  } else if (/^7\d{8}$/.test(phone)) {
    phone = "+254" + phone;
  } else if (phone.startsWith("254")) {
    phone = "+" + phone;
  }

  if (!phone.startsWith("+254") && !phone.startsWith("254")) {
    throw new Error("Phone number must be a valid Kenyan number (e.g. 0712345678, 254712345678, +254712345678)");
  }
  return phone;
}

function addMonthsUtc(nowMs: number, months: number) {
  const d = new Date(nowMs);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const next = new Date(Date.UTC(y, m + months, day, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
  return next.getTime();
}

function planDurationToMonths(planDuration: string) {
  switch (planDuration) {
    case "1_day":
      return 1 / 30; // ~0.033 months
    case "1_week":
      return 1 / 4; // ~0.25 months
    case "1_month":
    case "1_months":
      return 1;
    case "3_months":
      return 3;
    case "6_months":
      return 6;
    case "12_months":
      return 12;
    default:
      return 1;
  }
}

export const initiatePayment = action({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: v.optional(v.string()),
    paymentMethod: v.string(),
    productType: v.string(),
    plan: v.optional(v.string()),
    planDuration: v.optional(v.string()),
    metadata: v.optional(v.any()),
    targetUserId: v.optional(v.id("users")), // For profile unlocks
  },
  handler: async (ctx, args): Promise<{ paymentId: Id<"payments">; transactionId: string }> => {
    const currency = args.currency ?? "KES";

    // Server-side price enforcement
    const expected = (() => {
      if (args.productType === "subscription") {
        const d = args.planDuration ?? "";
        if (d === "1_week") return 100;
        if (d === "1_month") return 350;
        throw new Error("Invalid subscription duration. Only weekly or monthly is allowed.");
      }
      if (args.productType.includes("unlock")) return 10;
      return args.amount;
    })();

    if (args.currency && args.currency !== "KES") {
      throw new Error("Only KES currency is supported");
    }

    // 1) Create a local payment record (internal mutation)
    const { paymentId } = (await ctx.runMutation(internal.paymentsInternal.createPendingPayment, {
      userId: args.userId,
      amount: expected,
      currency,
      paymentMethod: args.paymentMethod,
      productType: args.productType,
      plan: args.plan,
      planDuration: args.planDuration,
      metadata: args.metadata,
      targetUserId: args.targetUserId,
    })) as { paymentId: Id<"payments"> };

    // 2) Initiate Lipana STK push (action)
    const rawPhone = (args.metadata as any)?.phoneNumber ?? (args.metadata as any)?.phone;
    if (!rawPhone) {
      throw new Error("Phone number is required for M-Pesa STK push");
    }
    const phone = normalizeKenyanPhone(String(rawPhone));

    const stk = (await ctx.runAction(api.lipana.initiateStkPush, {
      phone,
      amount: expected,
    })) as { transactionId: string; checkoutRequestID?: string };

    // 3) Attach STK identifiers to payment (internal mutation)
    await ctx.runMutation(internal.paymentsInternal.attachLipanaStk, {
      paymentId,
      transactionId: stk.transactionId,
      checkoutRequestID: stk.checkoutRequestID,
      phone,
      plan: args.plan,
      planDuration: args.planDuration,
      targetUserId: args.targetUserId,
      customMetadata: args.metadata,
    });

    return { paymentId, transactionId: stk.transactionId };
  },
});

async function finalizePaymentCore(
  ctx: any,
  args: { paymentId: any; userId: any; success: boolean }
) {
  const payment = await ctx.db.get(args.paymentId);
  if (!payment) throw new Error("Payment not found");
  if (payment.userId !== args.userId) throw new Error("Unauthorized");
  if (payment.status === "completed") return { status: "completed", subscriptionId: payment.subscriptionId ?? null };

  const now = Date.now();

  if (!args.success) {
    await ctx.db.patch(args.paymentId, {
      status: "failed",
      completedAt: now,
    });

    await insertNotification(ctx, {
      userId: args.userId,
      type: "payment_failed",
      title: "Payment Failed",
      body: "Your payment could not be processed. Please try again or use a different payment method.",
      priority: "high",
      category: "payment",
      icon: "❌",
      relatedPaymentId: args.paymentId,
      link: "/upgrade",
    });

    return { status: "failed", subscriptionId: null };
  }

  let subscriptionId: any = null;

  if (payment.productType === "subscription") {
    const plan = (payment.metadata as any)?.plan ?? "premium";
    const planDuration = (payment.metadata as any)?.planDuration ?? "1_month";
    const months = planDurationToMonths(planDuration);
    const periodEnds = addMonthsUtc(now, months);

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    if (existing && existing.status === "active") {
      await ctx.db.patch(existing._id, {
        status: "canceled",
        endsAt: existing.endsAt ?? existing.currentPeriodEnds ?? now,
        autoRenew: false,
        canceledAt: now,
        updatedAt: now,
      });
    }

    subscriptionId = await ctx.db.insert("subscriptions", {
      userId: args.userId,
      plan,
      status: "active",
      amount: payment.amount,
      currency: payment.currency,
      billingCycle:
        planDuration === "1_day"
          ? "daily"
          : planDuration === "1_week"
            ? "weekly"
            : months === 1
              ? "monthly"
              : months === 3
                ? "quarterly"
                : months === 6
                  ? "biannual"
                  : "annual",
      startedAt: now,
      currentPeriodEnds: periodEnds,
      endsAt: periodEnds,
      autoRenew: true,
      paymentMethod: payment.paymentMethod,
      updatedAt: now,
    });
  }

  await ctx.db.patch(args.paymentId, {
    status: "completed",
    completedAt: now,
    subscriptionId: subscriptionId ?? undefined,
  });

  await insertNotification(ctx, {
    userId: args.userId,
    type: "payment_success",
    title: "Payment Successful! 🎊",
    body:
      payment.productType === "subscription"
        ? "Your subscription is now active. Enjoy your premium features!"
        : payment.productType.includes("unlock")
            ? "Item unlocked! You can now access it."
            : "Your purchase was successful!",
    priority: "high",
    category: "payment",
    icon: "✅",
    relatedPaymentId: args.paymentId,
    link: payment.productType === "subscription" ? "/settings" : undefined,
  });

  if (payment.productType === "subscription" && subscriptionId) {
    await insertNotification(ctx, {
      userId: args.userId,
      type: "subscription_active",
      title: "Premium Activated! ✨",
      body: "Your premium subscription is now active. Explore all the exclusive features!",
      priority: "medium",
      category: "system",
      icon: "💎",
      actionButtons: [
        { label: "Explore Features", action: "navigate", link: "/discover" },
        { label: "Settings", action: "navigate", link: "/settings" },
      ],
    });
  }

  return { status: "completed", subscriptionId };
}

export const cleanupOldFailedPayments = internalMutation({
  args: { olderThanMinutes: v.optional(v.number()), batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const olderThanMinutes = Math.min(Math.max(args.olderThanMinutes ?? 10, 1), 24 * 60);
    const batchSize = Math.min(Math.max(args.batchSize ?? 200, 1), 500);
    const cutoff = Date.now() - olderThanMinutes * 60 * 1000;

    const failed = await ctx.db
      .query("payments")
      .withIndex("status", (q) => q.eq("status", "failed"))
      .order("asc")
      .take(batchSize);

    let deleted = 0;
    for (const p of failed) {
      const ts = p.completedAt ?? p.createdAt;
      if (ts <= cutoff) {
        await ctx.db.delete(p._id);
        deleted++;
      }
    }

    return { deleted, cutoff };
  },
});

export const finalizePaymentInternal = internalMutation({
  args: {
    paymentId: v.id("payments"),
    userId: v.id("users"),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await finalizePaymentCore(ctx, args);
  },
});

// Backwards-compatible endpoint: clients may only acknowledge failures.
export const confirmPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    userId: v.id("users"),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.success) {
      throw new Error(
        "Payment confirmation is handled automatically. Please complete payment and wait for verification."
      );
    }
    return await finalizePaymentCore(ctx, args as any);
  },
});

export const verifyPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    userId: v.id("users"),
    // Kept for backwards compatibility with old client flows.
    // In production, the client SHOULD NOT be able to mark success=true.
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Only allow client-side failure acknowledgments.
    // Success must be confirmed via server-side verification (Lipana).
    if (args.success) {
      throw new Error("Payment confirmation is handled automatically. Please complete payment and wait for verification.");
    }
    return await finalizePaymentCore(ctx, args as any);
  },
});

export const getMyPayments = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
    const cutoff = Date.now() - 10 * 60 * 1000;

    const rows = await ctx.db
      .query("payments")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit * 2);

    // Backstop: hide failed payments older than 10 minutes even if cron hasn't deleted them yet.
    const filtered = rows.filter((p) => {
      if (p.status !== "failed") return true;
      const ts = p.completedAt ?? p.createdAt;
      return ts > cutoff;
    });

    return filtered.slice(0, limit);
  },
});
