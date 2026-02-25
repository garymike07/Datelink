/**
 * subscriptionExpiry.ts
 *
 * Handles automatic subscription expiry enforcement and renewal reminder notifications.
 *
 * Cron jobs in crons.ts call:
 *   - expireSubscriptions: marks active subscriptions as "expired" if endsAt has passed
 *   - sendRenewalReminders: sends in-app notifications 3 days and 1 day before expiry
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { insertNotification } from "./notifications";

/**
 * Expire subscriptions whose endsAt timestamp has passed.
 * Runs every hour via cron.
 */
export const expireSubscriptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Fetch all active subscriptions (no index on status, so we filter in code)
    // Convex does not support cross-table indexes, so we scan and filter.
    const active = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let expired = 0;

    for (const sub of active) {
      const expiresAt = sub.endsAt ?? (sub as any).currentPeriodEnds;
      if (typeof expiresAt !== "number") continue;
      if (expiresAt > now) continue;

      // Mark as expired
      await ctx.db.patch(sub._id, {
        status: "expired",
        updatedAt: now,
      });
      expired++;

      // Send in-app notification
      await insertNotification(ctx, {
        userId: sub.userId,
        type: "subscription_expired",
        title: "Your Premium Subscription Has Expired",
        body: "Your premium access has ended. Renew now to continue enjoying unlimited features.",
        priority: "high",
        category: "system",
        icon: "🔒",
        link: "/subscription",
        actionButtons: [
          { label: "Weekly Plan — KES 100", action: "navigate", link: "/subscription" },
          { label: "Monthly Plan — KES 350", action: "navigate", link: "/subscription" },
        ],
      });
    }

    return { expired, checkedAt: now };
  },
});

/**
 * Send renewal reminder notifications 3 days and 1 day before expiry.
 * Runs daily via cron.
 */
export const sendRenewalReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    const active = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let reminded = 0;

    for (const sub of active) {
      const expiresAt = sub.endsAt ?? (sub as any).currentPeriodEnds;
      if (typeof expiresAt !== "number") continue;

      const msUntilExpiry = expiresAt - now;
      if (msUntilExpiry <= 0) continue;

      const daysUntilExpiry = msUntilExpiry / DAY_MS;

      // 3-day reminder
      if (daysUntilExpiry <= 3 && daysUntilExpiry > 2) {
        const groupKey = `renewal_reminder_3d_${sub._id}`;
        const existing = await ctx.db
          .query("notifications")
          .withIndex("groupKey", (q) =>
            q.eq("userId", sub.userId).eq("groupKey", groupKey)
          )
          .first();
        if (!existing) {
          await insertNotification(ctx, {
            userId: sub.userId,
            type: "subscription_renewing",
            title: "Premium Expiring in 3 Days",
            body: "Your premium subscription expires in 3 days. Renew now to avoid any interruption.",
            priority: "high",
            category: "system",
            icon: "⏰",
            link: "/subscription",
            actionButtons: [
              { label: "Renew Now", action: "navigate", link: "/subscription" },
            ],
          });
          // Tag the notification with the group key to avoid duplicates
          const latest = await ctx.db
            .query("notifications")
            .withIndex("userId", (q) => q.eq("userId", sub.userId))
            .order("desc")
            .first();
          if (latest) {
            await ctx.db.patch(latest._id, { groupKey });
          }
          reminded++;
        }
      }

      // 1-day reminder
      if (daysUntilExpiry <= 1 && daysUntilExpiry > 0) {
        const groupKey = `renewal_reminder_1d_${sub._id}`;
        const existing = await ctx.db
          .query("notifications")
          .withIndex("groupKey", (q) =>
            q.eq("userId", sub.userId).eq("groupKey", groupKey)
          )
          .first();
        if (!existing) {
          await insertNotification(ctx, {
            userId: sub.userId,
            type: "subscription_renewing",
            title: "Premium Expiring Tomorrow!",
            body: "Your premium subscription expires in less than 24 hours. Renew now to keep your access.",
            priority: "critical",
            category: "system",
            icon: "🚨",
            link: "/subscription",
            actionButtons: [
              { label: "Weekly Plan — KES 100", action: "navigate", link: "/subscription" },
              { label: "Monthly Plan — KES 350", action: "navigate", link: "/subscription" },
            ],
          });
          const latest = await ctx.db
            .query("notifications")
            .withIndex("userId", (q) => q.eq("userId", sub.userId))
            .order("desc")
            .first();
          if (latest) {
            await ctx.db.patch(latest._id, { groupKey });
          }
          reminded++;
        }
      }
    }

    return { reminded, checkedAt: now };
  },
});
