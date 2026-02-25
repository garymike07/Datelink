// Phase 2 Notification System Test Script
// This script can be used to test the notification system implementation

import { api } from "./convex/_generated/api";

/**
 * Test 1: Create a test notification
 * Usage: Call this from your dev console or a test page
 */
export async function testCreateNotification(convex: any, userId: string) {
  try {
    await convex.mutation(api.notifications.createNotification, {
      userId: userId as any,
      type: "match",
      title: "🎉 It's a Match!",
      body: "You and Sarah have matched! Start chatting now.",
      priority: "high",
      category: "social",
      imageUrl: "https://via.placeholder.com/150",
      link: "/matches",
      actionButtons: [
        { label: "Say Hi", action: "message", link: "/chat/123" },
        { label: "View Profile", action: "view", link: "/profile/123" },
      ],
    });
    console.log("✅ Test notification created successfully");
  } catch (error) {
    console.error("❌ Error creating notification:", error);
  }
}

/**
 * Test 2: Create multiple notifications to test aggregation
 */
export async function testAggregatedNotifications(convex: any, userId: string) {
  try {
    // Create 3 like notifications with the same groupKey
    for (let i = 0; i < 3; i++) {
      await convex.mutation(api.notifications.createNotification, {
        userId: userId as any,
        type: "like",
        title: "New Likes!",
        body: `You have {count} new likes`,
        priority: "medium",
        category: "engagement",
        groupKey: `likes_batch_${userId}`,
        link: "/likes",
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log("✅ Aggregated notifications created successfully");
  } catch (error) {
    console.error("❌ Error creating aggregated notifications:", error);
  }
}

/**
 * Test 3: Create critical notification (should trigger sound)
 */
export async function testCriticalNotification(convex: any, userId: string) {
  try {
    await convex.mutation(api.notifications.createNotification, {
      userId: userId as any,
      type: "call_incoming",
      title: "📞 Incoming Call",
      body: "Sarah is calling you...",
      priority: "critical",
      category: "call",
      link: "/call/123",
      actionButtons: [
        { label: "Answer", action: "answer", link: "/call/123" },
        { label: "Decline", action: "decline" },
      ],
    });
    console.log("✅ Critical notification created (should play sound)");
  } catch (error) {
    console.error("❌ Error creating critical notification:", error);
  }
}

/**
 * Test 4: Test all notification categories
 */
export async function testAllCategories(convex: any, userId: string) {
  const testNotifications = [
    {
      type: "match",
      title: "New Match",
      body: "You have a new match!",
      category: "social",
      priority: "high",
    },
    {
      type: "call_missed",
      title: "Missed Call",
      body: "You missed a call from John",
      category: "call",
      priority: "medium",
    },
    {
      type: "payment_success",
      title: "Payment Successful",
      body: "Your premium subscription is now active",
      category: "payment",
      priority: "high",
    },
    {
      type: "profile_viewed",
      title: "Profile Views",
      body: "5 people viewed your profile today",
      category: "engagement",
      priority: "low",
    },
    {
      type: "verification_complete",
      title: "Verification Complete",
      body: "Your profile is now verified!",
      category: "system",
      priority: "medium",
    },
  ];

  for (const notif of testNotifications) {
    try {
      await convex.mutation(api.notifications.createNotification, {
        userId: userId as any,
        ...notif,
      } as any);
      console.log(`✅ Created ${notif.category} notification`);
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Error creating ${notif.category} notification:`, error);
    }
  }
}

/**
 * Instructions:
 * 
 * 1. Open your browser console on the app
 * 2. Import this script or copy the functions
 * 3. Get the Convex client and user ID:
 *    const convex = window.__convexClient; // or however you access it
 *    const userId = "your-user-id";
 * 
 * 4. Run tests:
 *    testCreateNotification(convex, userId);
 *    testAggregatedNotifications(convex, userId);
 *    testCriticalNotification(convex, userId);
 *    testAllCategories(convex, userId);
 * 
 * 5. Verify:
 *    - Notification bell shows unread count
 *    - Clicking bell opens notification dropdown
 *    - Category tabs show correct counts
 *    - Toast appears for high/critical priority
 *    - Sound plays for critical notifications
 *    - Browser notifications work when tab is not focused
 */
