import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Creates the initial payment record (pending) and returns its id.
export const createPendingPayment = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.string(),
    productType: v.string(),
    plan: v.optional(v.string()),
    planDuration: v.optional(v.string()),
    metadata: v.optional(v.any()),
    targetUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const localTxId = `local_${now}_${Math.random().toString(16).slice(2)}`;

    const paymentId = await ctx.db.insert("payments", {
      userId: args.userId,
      amount: args.amount,
      currency: args.currency,
      paymentMethod: args.paymentMethod,
      status: "pending",
      transactionId: localTxId,
      subscriptionId: undefined,
      productType: args.productType,
      metadata: {
        ...args.metadata,
        plan: args.plan,
        planDuration: args.planDuration,
        targetUserId: args.targetUserId,
        lipana: undefined,
      },
      createdAt: now,
      completedAt: undefined,
    });

    return { paymentId, localTxId };
  },
});

// Attaches Lipana link information to the payment record.
export const attachLipanaLink = internalMutation({
  args: {
    paymentId: v.id("payments"),
    transactionId: v.string(),
    plan: v.optional(v.string()),
    planDuration: v.optional(v.string()),
    targetUserId: v.optional(v.id("users")),
    checkoutUrl: v.string(),
    paymentLinkId: v.string(),
    customMetadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      transactionId: args.transactionId,
      metadata: {
        plan: args.plan,
        planDuration: args.planDuration,
        targetUserId: args.targetUserId,
        lipana: { paymentLinkId: args.paymentLinkId, checkoutUrl: args.checkoutUrl },
        custom: args.customMetadata ?? undefined,
      },
    });
    return { ok: true };
  },
});

export const attachLipanaStk = internalMutation({
  args: {
    paymentId: v.id("payments"),
    transactionId: v.string(),
    checkoutRequestID: v.optional(v.string()),
    phone: v.string(),
    plan: v.optional(v.string()),
    planDuration: v.optional(v.string()),
    targetUserId: v.optional(v.id("users")),
    customMetadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      transactionId: args.transactionId,
      metadata: {
        plan: args.plan,
        planDuration: args.planDuration,
        targetUserId: args.targetUserId,
        lipana: {
          stk: {
            transactionId: args.transactionId,
            checkoutRequestID: args.checkoutRequestID,
            phone: args.phone,
          },
        },
        custom: args.customMetadata ?? undefined,
      },
    });
    return { ok: true };
  },
});
