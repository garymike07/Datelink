import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

// Stub integration point for Safaricom Daraja STK Push.
// This project currently confirms payments immediately from the client (dev-friendly).
// When you add real credentials/webhooks, move confirmation into this module.

export const initiateMpesaPayment = internalMutation({
  args: {
    phoneNumber: v.string(),
    amount: v.number(),
    userId: v.id("users"),
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.userId !== args.userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.paymentId, {
      status: "processing",
      metadata: {
        ...(payment.metadata as any),
        phoneNumber: args.phoneNumber,
      },
    });

    return { status: "processing" };
  },
});

export const mpesaCallback = mutation({
  args: {
    transactionId: v.string(),
    status: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("transactionId", (q) => q.eq("transactionId", args.transactionId))
      .first();
    if (!payment) throw new Error("Payment not found");

    await ctx.db.patch(payment._id, {
      status: args.status,
      metadata: { ...(payment.metadata as any), ...(args.metadata as any) },
      completedAt: args.status === "completed" ? Date.now() : payment.completedAt,
    });

    return { ok: true };
  },
});
