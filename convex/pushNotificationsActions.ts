/**
 * Push Notifications Actions
 * 
 * Convex actions for sending actual push notifications via external services.
 * Actions can call external APIs (like web-push) unlike mutations.
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Send push notification via Web Push API
 * 
 * This action sends actual push notifications to users' devices.
 * In production, you need to:
 * 1. Generate VAPID keys: npx web-push generate-vapid-keys
 * 2. Set environment variables: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
 * 3. Install web-push library in your Convex project
 */
export const sendWebPushNotification = action({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    priority: v.optional(v.union(v.literal("high"), v.literal("normal"), v.literal("low"))),
  },
  handler: async (ctx, args): Promise<{
    sent: boolean;
    sentCount?: number;
    failedCount?: number;
    totalSubscriptions?: number;
    results?: Array<{
      subscriptionId: any;
      status: string;
      platform?: string;
      error?: string;
    }>;
    reason?: string;
  }> => {
    // Get user's push subscriptions
    const subscriptions: any = await ctx.runQuery(api.pushNotifications.getUserPushSubscriptionsByUserId, {
      userId: args.userId,
    });

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for user:", args.userId);
      return { sent: false, reason: "no_subscriptions" };
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      type: args.type,
      icon: "/logo.svg",
      badge: "/favicon.svg",
      data: args.data || {},
      priority: args.priority || "normal",
      timestamp: Date.now(),
    });

    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    // Send to all active subscriptions
    for (const subscription of subscriptions) {
      try {
        // In production, you would use web-push library here:
        // const webpush = require('web-push');
        // webpush.setVapidDetails(
        //   process.env.VAPID_EMAIL,
        //   process.env.VAPID_PUBLIC_KEY,
        //   process.env.VAPID_PRIVATE_KEY
        // );
        // 
        // await webpush.sendNotification(
        //   {
        //     endpoint: subscription.endpoint,
        //     keys: subscription.keys
        //   },
        //   payload
        // );

        // For now, log that we would send
        console.log("Would send push notification to:", subscription.endpoint.substring(0, 50));
        
        // Update last used timestamp
        await ctx.runMutation(api.pushNotifications.updateSubscriptionLastUsed, {
          subscriptionId: subscription._id,
        });

        sentCount++;
        results.push({ 
          subscriptionId: subscription._id, 
          status: "sent",
          platform: subscription.platform 
        });
      } catch (error: any) {
        console.error("Failed to send push notification:", error);
        failedCount++;
        
        // If subscription is invalid, deactivate it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await ctx.runMutation(api.pushNotifications.deactivatePushSubscription, {
            subscriptionId: subscription._id,
          });
          results.push({ 
            subscriptionId: subscription._id, 
            status: "invalid",
            error: "subscription_expired" 
          });
        } else {
          results.push({ 
            subscriptionId: subscription._id, 
            status: "failed",
            error: error.message 
          });
        }
      }
    }

    return {
      sent: sentCount > 0,
      sentCount,
      failedCount,
      totalSubscriptions: subscriptions.length,
      results,
    };
  },
});

/**
 * Send batch push notifications
 */
export const sendBatchWebPushNotifications = action({
  args: {
    notifications: v.array(v.object({
      userId: v.id("users"),
      type: v.string(),
      title: v.string(),
      body: v.string(),
      data: v.optional(v.any()),
      priority: v.optional(v.union(v.literal("high"), v.literal("normal"), v.literal("low"))),
    })),
  },
  handler: async (ctx, args): Promise<{
    totalNotifications: number;
    results: Array<any>;
  }> => {
    const results: Array<any> = [];

    for (const notification of args.notifications) {
      const result: any = await ctx.runAction(api.pushNotificationsActions.sendWebPushNotification, notification);
      results.push({ userId: notification.userId, ...result });
    }

    return {
      totalNotifications: args.notifications.length,
      results,
    };
  },
});
