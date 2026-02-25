import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Deletes failed payment rows older than a configured age.
export const cleanupOldFailedPayments = internalMutation({
  args: {
    olderThanMinutes: v.optional(v.number()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const olderThanMinutes = Math.min(Math.max(args.olderThanMinutes ?? 10, 1), 24 * 60);
    const batchSize = Math.min(Math.max(args.batchSize ?? 200, 1), 500);

    const cutoff = Date.now() - olderThanMinutes * 60 * 1000;

    // Prefer completedAt if set; fall back to createdAt for rows that never completed.
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
