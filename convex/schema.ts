import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

 export default defineSchema({
  // Authentication
  users: defineTable({
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    phoneNumber: v.optional(v.string()), // Alias for phone
    isVerified: v.boolean(),
    emailVerified: v.optional(v.boolean()), // Email verification status
    verificationStatus: v.optional(v.string()), // "none", "pending", "verified"
    accountStatus: v.optional(v.union(
      v.literal("active"),
      v.literal("deactivated"),
      v.literal("deleted")
    )),
    deactivatedAt: v.optional(v.number()),
    lastSeenAt: v.optional(v.number()),
    lastActive: v.optional(v.number()), // Last activity timestamp
    // Free Trial Fields
    freeTrialStartedAt: v.optional(v.number()),
    freeTrialEndsAt: v.optional(v.number()),
    freeTrialUsed: v.optional(v.boolean()),
    // Daily Unlock (KES 10 for 24h full access after trial expires)
    dailyUnlockEndsAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("email", ["email"]),

  // Sessions for authentication
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    lastAccessedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("token", ["token"])
    .index("expiresAt", ["expiresAt"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.string(), // "free" | "premium"
    status: v.string(), // "active" | "canceled" | "expired" | "past_due"
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    billingCycle: v.optional(v.string()), // "weekly" | "monthly" | "quarterly" | "biannual" | "annual"
    startedAt: v.number(),
    currentPeriodEnds: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    autoRenew: v.optional(v.boolean()),
    paymentMethod: v.optional(v.string()),
    canceledAt: v.optional(v.number()),
    cancellationReason: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("plan", ["plan"])
    .index("status", ["status"]),

  premiumAddons: defineTable({
    userId: v.id("users"),
    addonType: v.string(), // e.g. "premium_plus"
    status: v.string(), // "active" | "expired"
    startsAt: v.number(),
    endsAt: v.number(),
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("userStatus", ["userId", "status"]),

  payments: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(), // "USD"
    paymentMethod: v.string(), // "mpesa" | "card" | "airtel_money" | "bank_transfer"
    status: v.string(), // "pending" | "processing" | "completed" | "failed" | "refunded"
    transactionId: v.string(), // External payment ID (or internal reference)
    subscriptionId: v.optional(v.id("subscriptions")),
    productType: v.string(), // "subscription" | "premium_addon" | "super_likes" | "boost" | "profile_unlock" | "match_unlock" | "like_unlock"
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("transactionId", ["transactionId"])
    .index("status", ["status"])
    .index("statusCompletedAt", ["status", "completedAt"]),

  dailyUsage: defineTable({
    userId: v.id("users"),
    dayKey: v.string(), // YYYY-MM-DD (UTC)
    likes: v.number(),
    superLikes: v.number(),
    messages: v.optional(v.number()), // Daily message count for restricted users
    profileViews: v.optional(v.number()), // Daily profile view count for restricted users
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("userDay", ["userId", "dayKey"]),

  userSettings: defineTable({
    userId: v.id("users"),
    showOnlineStatus: v.boolean(),
    readReceipts: v.boolean(),
    emailNotifications: v.boolean(),
    matchNotifications: v.boolean(),
    messageNotifications: v.boolean(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"]),

  // Phase 7: Notifications (in-app) - Enhanced in Phase 1
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      // Existing
      v.literal("match"),
      v.literal("message"),
      v.literal("like"),
      v.literal("super_like"),
      v.literal("profile_view"),
      v.literal("quest_complete"),
      v.literal("badge_unlock"),
      v.literal("boost_active"),
      v.literal("boost_ending"),
      v.literal("verification_complete"),

      // NEW - Core Features
      v.literal("profile_created"),
      v.literal("payment_success"),
      v.literal("payment_failed"),
      v.literal("subscription_active"),
      v.literal("subscription_expiring"),

      // NEW - Auth
      v.literal("login_success"),
      // NEW - Engagement
      v.literal("likes_received_batch"),
      v.literal("super_like_received"),
      v.literal("profile_viewed"),
      v.literal("top_picks_ready"),
      v.literal("new_match_potential"),

      // NEW - Premium Features
      v.literal("boost_started"),
      v.literal("boost_results"),
      v.literal("rewind_available"),

      // NEW - Safety & Verification
      v.literal("verification_pending"),
      v.literal("verification_rejected"),
      v.literal("account_warning"),
      v.literal("daily_reward"),
      // Trial & access notifications
      v.literal("trial_ending"),
      v.literal("trial_expired"),
      v.literal("daily_unlock_expired")
    ),
    title: v.string(),
    body: v.string(),

    // Enhanced metadata
    priority: v.optional(v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    )),
    category: v.optional(v.union(
      v.literal("social"),      v.literal("payment"),
      v.literal("engagement"),
      v.literal("system")
    )),

    // Rich notification data
    icon: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    actionButtons: v.optional(v.array(
      v.object({
        label: v.string(),
        action: v.string(),
        link: v.optional(v.string()),
      })
    )),

    // Relations
    relatedUserId: v.optional(v.id("users")),
    relatedMatchId: v.optional(v.id("matches")),
    relatedMessageId: v.optional(v.id("messages")),    relatedPaymentId: v.optional(v.id("payments")),

    link: v.optional(v.string()),

    // Status tracking
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    clickedAt: v.optional(v.number()),

    // Grouping support
    groupKey: v.optional(v.string()),
    aggregatedCount: v.optional(v.number()),

    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("userRead", ["userId", "isRead"])
    .index("userCreatedAt", ["userId", "createdAt"])
    .index("userPriority", ["userId", "priority"])
    .index("groupKey", ["userId", "groupKey"])
    .index("expiresAt", ["expiresAt"]),

  // Phase 3: Notification Preferences
  notificationPreferences: defineTable({
    userId: v.id("users"),

    // Global settings
    enabled: v.boolean(),
    quietHoursEnabled: v.boolean(),
    quietHoursStart: v.optional(v.string()), // "22:00"
    quietHoursEnd: v.optional(v.string()),   // "08:00"

    // Category preferences
    socialEnabled: v.boolean(),
    callEnabled: v.boolean(),
    paymentEnabled: v.boolean(),
    engagementEnabled: v.boolean(),
    systemEnabled: v.boolean(),

    // Type-specific preferences
    matchNotifications: v.boolean(),
    messageNotifications: v.boolean(),
    likeNotifications: v.boolean(),
    superLikeNotifications: v.boolean(),
    profileViewNotifications: v.boolean(),
    callNotifications: v.boolean(),
    paymentNotifications: v.boolean(),

    // Delivery preferences
    pushEnabled: v.boolean(),
    emailEnabled: v.boolean(),
    smsEnabled: v.optional(v.boolean()),

    // Batching preferences
    batchLikes: v.boolean(),
    batchProfileViews: v.boolean(),
    batchFrequency: v.optional(v.string()), // "hourly", "daily"

    // Sound preferences
    soundEnabled: v.boolean(),
    vibrationEnabled: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"]),

  // User Profiles
  profiles: defineTable({
    userId: v.id("users"),
    age: v.number(),
    gender: v.string(), // "man", "woman", "non-binary", "other"
    location: v.string(), // City name
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    bio: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
    education: v.optional(v.string()),
    height: v.optional(v.number()), // in cm
    religion: v.optional(v.string()),
    drinking: v.optional(v.string()), // "never", "socially", "regularly"
    smoking: v.optional(v.string()), // "never", "socially", "regularly"
    hasKids: v.optional(v.boolean()),
    wantsKids: v.optional(v.string()), // "yes", "no", "maybe", "open"
    relationshipGoal: v.optional(v.string()), // "serious", "casual", "friendship", "marriage"
    languages: v.optional(v.array(v.string())), // Languages spoken
    pets: v.optional(v.string()), // "dog", "cat", "both", "none", "other"
    exercise: v.optional(v.string()), // "never", "sometimes", "active", "very_active"
    diet: v.optional(v.string()), // "no_preference", "vegetarian", "vegan", "halal", "kosher"
    completeness: v.number(), // 0-100 percentage
    // Phase 2: Premium features
    boostEndsAt: v.optional(v.number()), // Boost expiration timestamp
    elo: v.optional(v.number()), // Match quality score (default: 1500, range: 100-3000)
    visibilityScore: v.optional(v.number()), // Ranking weight (default: 100)
    lastActiveAt: v.optional(v.number()), // Last activity timestamp
    completenessScore: v.optional(v.number()), // Profile quality score
    // Phase 4: Passport Mode (Premium)
    passportLat: v.optional(v.number()),
    passportLon: v.optional(v.number()),
    passportCity: v.optional(v.string()),
    passportExpiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("gender", ["gender"])
    .index("age", ["age"])
    .index("elo", ["elo"])
    .index("visibilityScore", ["visibilityScore"]),

  // Profile Photos
  photos: defineTable({
    userId: v.id("users"),
    profileId: v.id("profiles"),
    url: v.string(), // base64 or external URL
    order: v.number(), // 0-8 for ordering
    isPrimary: v.boolean(),
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("profileId", ["profileId"])
    .index("primary", ["userId", "isPrimary"]),

  // Matching Preferences
  preferences: defineTable({
    userId: v.id("users"),
    profileId: v.id("profiles"),
    minAge: v.number(),
    maxAge: v.number(),
    maxDistance: v.number(), // in km
    genderPreference: v.array(v.string()), // ["man", "woman", "non-binary"]
    // Phase 4: Advanced Filters (Premium)
    minHeight: v.optional(v.number()),
    maxHeight: v.optional(v.number()),
    relationshipGoals: v.optional(v.array(v.string())),
    religions: v.optional(v.array(v.string())),
    education: v.optional(v.array(v.string())),
    drinking: v.optional(v.array(v.string())),
    smoking: v.optional(v.array(v.string())),
    exercise: v.optional(v.array(v.string())),
    diet: v.optional(v.array(v.string())),
    hasKids: v.optional(v.boolean()),
    wantsKids: v.optional(v.boolean()),
    mustBeVerified: v.optional(v.boolean()),
    mustHavePhotos: v.optional(v.boolean()),
    mustHaveBio: v.optional(v.boolean()),
    activeInLast7Days: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("profileId", ["profileId"]),

  // User Interests/Tags
  interests: defineTable({
    userId: v.id("users"),
    profileId: v.id("profiles"),
    interest: v.string(), // e.g., "music", "travel", "sports", "cooking"
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("profileId", ["profileId"])
    .index("interest", ["interest"]),

  // Likes (swipe right)
  likes: defineTable({
    userId: v.id("users"), // who liked
    likedUserId: v.id("users"), // who was liked
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("likedUserId", ["likedUserId"])
    .index("pair", ["userId", "likedUserId"]),

  // Matches (mutual likes)
  matches: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    matchedAt: v.number(),
    lastMessageAt: v.optional(v.number()),
    user1Unread: v.number(), // unread count for user1
    user2Unread: v.number(), // unread count for user2
  })
    .index("user1Id", ["user1Id"])
    .index("user2Id", ["user2Id"])
    .index("users", ["user1Id", "user2Id"]),

  // Passes (swipe left)
  passes: defineTable({
    userId: v.id("users"), // who passed
    passedUserId: v.id("users"), // who was passed
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("pair", ["userId", "passedUserId"]),

  // Messages
  messages: defineTable({
    matchId: v.id("matches"),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    body: v.string(),
    type: v.optional(v.union(v.literal("text"), v.literal("gif"), v.literal("voice"), v.literal("photo"), v.literal("system"), v.literal("attachment"))),
    replyToId: v.optional(v.id("messages")),
    deliveredAt: v.optional(v.number()),
    readAt: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        gifUrl: v.optional(v.string()),
        voiceUrl: v.optional(v.string()),
        voiceDuration: v.optional(v.number()),
        photoUrl: v.optional(v.string()),
        attachmentId: v.optional(v.id("_storage")),
        attachmentUrl: v.optional(v.string()),
        attachmentName: v.optional(v.string()),
        attachmentType: v.optional(v.string()),
        attachmentSize: v.optional(v.number()),
      })
    ),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedForUserIds: v.optional(v.array(v.id("users"))),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("matchId", ["matchId"])
    .index("senderId", ["senderId"])
    .index("receiverId", ["receiverId"]),

  // Phase 5: Scheduled Messages (Premium)
  scheduledMessages: defineTable({
    matchId: v.id("matches"),
    senderId: v.id("users"),
    body: v.string(),
    type: v.optional(v.union(v.literal("text"), v.literal("gif"), v.literal("voice"), v.literal("photo"), v.literal("attachment"))),
    metadata: v.optional(
      v.object({
        gifUrl: v.optional(v.string()),
        voiceUrl: v.optional(v.string()),
        voiceDuration: v.optional(v.number()),
        photoUrl: v.optional(v.string()),
        attachmentId: v.optional(v.id("_storage")),
        attachmentUrl: v.optional(v.string()),
        attachmentName: v.optional(v.string()),
        attachmentType: v.optional(v.string()),
        attachmentSize: v.optional(v.number()),
      })
    ),
    scheduledFor: v.number(),
    sent: v.boolean(),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("matchId", ["matchId"])
    .index("senderId", ["senderId"])
    .index("due", ["sent", "scheduledFor"]),

  // Calls (Video/Audio calling)
  calls: defineTable({
    matchId: v.id("matches"),
    callerId: v.id("users"),
    receiverId: v.id("users"),
    callType: v.union(v.literal("video"), v.literal("audio")), // NEW: Type of call
    status: v.union(
      v.literal("calling"),
      v.literal("ringing"),      // NEW: Call is ringing on receiver's end
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("ended"),
      v.literal("missed")        // NEW: Call was not answered
    ),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    endReason: v.optional(v.string()), // NEW: "completed", "declined", "no_answer", "error", "cancelled"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("matchId", ["matchId"])
    .index("callerId", ["callerId"])
    .index("receiverId", ["receiverId"])
    .index("status", ["status"]),

  // Reports
  reports: defineTable({
    reporterId: v.id("users"),
    reportedUserId: v.id("users"),
    // Legacy fields (kept for backwards compatibility)
    reason: v.optional(v.string()), // "harassment", "spam", "inappropriate_content", "catfishing", "scam", "other"
    details: v.optional(v.string()),

    // Phase 6: Enhanced reporting
    category: v.optional(v.string()),
    subcategory: v.optional(v.string()),
    description: v.optional(v.string()),
    screenshots: v.optional(v.array(v.string())),
    status: v.string(), // "pending", "under_review", "action_taken", "dismissed"
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),

    // Admin fields (scaffolding)
    reviewedBy: v.optional(v.id("users")),
    actionTaken: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("reporterId", ["reporterId"])
    .index("reportedUserId", ["reportedUserId"])
    .index("status", ["status"]),

  // Blocks
  blocks: defineTable({
    blockerId: v.id("users"),
    blockedUserId: v.id("users"),
    createdAt: v.number(),
  })
    .index("blockerId", ["blockerId"])
    .index("blockedUserId", ["blockedUserId"])
    .index("pair", ["blockerId", "blockedUserId"]),

  // Prompts (Hinge-style profile questions)
  prompts: defineTable({
    text: v.string(),
    category: v.string(), // "personality", "lifestyle", "dating", "fun"
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("category", ["category"])
    .index("active", ["isActive"]),

  // Prompt Answers (user responses to prompts)
  promptAnswers: defineTable({
    userId: v.id("users"),
    profileId: v.id("profiles"),
    promptId: v.id("prompts"),
    answer: v.string(),
    order: v.number(), // 0-4 for ordering on profile
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("profileId", ["profileId"])
    .index("promptId", ["promptId"])
    .index("userOrder", ["userId", "order"]),

  // Super Likes (premium like feature)
  superLikes: defineTable({
    userId: v.id("users"), // who super-liked
    superLikedUserId: v.id("users"), // who was super-liked
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("superLikedUserId", ["superLikedUserId"])
    .index("pair", ["userId", "superLikedUserId"]),

  // Verifications (photo/ID verification)
  verifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // "photo", "id"
    status: v.string(), // "pending", "approved", "rejected", "expired"
    // Legacy single-photo field
    photoUrl: v.optional(v.string()),
    // Phase 6: selfie pose set
    verificationPhotos: v.optional(v.array(v.object({
      url: v.string(),
      pose: v.string(),
    }))),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    verifiedBy: v.optional(v.string()), // "ai" | "manual"
  })
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("type", ["type"]),

  // Typing Status (for typing indicators)
  typingStatus: defineTable({
    matchId: v.id("matches"),
    userId: v.id("users"),
    isTyping: v.boolean(),
    updatedAt: v.number(),
  })
    .index("matchId", ["matchId"])
    .index("matchUser", ["matchId", "userId"]),

  // Phase 2: Saved Searches
  savedSearches: defineTable({
    userId: v.id("users"),
    name: v.string(), // "Active professionals nearby"
    filters: v.object({
      minAge: v.number(),
      maxAge: v.number(),
      maxDistance: v.number(),
      genderPreference: v.array(v.string()),
      // Advanced filters
      minHeight: v.optional(v.number()),
      maxHeight: v.optional(v.number()),
      relationshipGoals: v.optional(v.array(v.string())),
      religions: v.optional(v.array(v.string())),
      education: v.optional(v.array(v.string())),
      verified: v.optional(v.boolean()),
    }),
    notificationsEnabled: v.boolean(), // Alert on new matches
    lastCheckedAt: v.optional(v.number()),
    newMatchesCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("userCreatedAt", ["userId", "createdAt"]),

  // Phase 2: Compatibility Scores
  compatibilityScores: defineTable({
    userId: v.id("users"),
    targetUserId: v.id("users"),
    score: v.number(), // 0-100
    factors: v.object({
      interestOverlap: v.number(),
      goalAlignment: v.number(),
      lifestyleMatch: v.number(),
      preferenceMatch: v.number(),
    }),
    calculatedAt: v.number(),
    weekKey: v.string(), // "2026-W03"
  })
    .index("userId", ["userId"])
    .index("userWeek", ["userId", "weekKey"])
    .index("userScore", ["userId", "score"]),

  // Phase 7: Presence (online/away/offline)
  presence: defineTable({
    userId: v.id("users"),
    lastActiveAt: v.number(),
    status: v.union(v.literal("online"), v.literal("away"), v.literal("offline")),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("updatedAt", ["updatedAt"]),

  // Message Reactions (emoji reactions to messages)
  messageReactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(), // emoji character
    createdAt: v.number(),
  })
    .index("messageId", ["messageId"])
    .index("userId", ["userId"])
    .index("messageUser", ["messageId", "userId"]),

  // Phase 2: Boosts (Premium feature for profile visibility)
  boosts: defineTable({
    userId: v.id("users"),
    activatedAt: v.number(),
    expiresAt: v.number(),
    impressions: v.number(), // How many people saw the profile
    likes: v.number(), // Likes gained during boost
    status: v.string(), // "active", "expired"
  })
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("expiresAt", ["expiresAt"]),

  // Phase 1: Onboarding Progress Tracking
  onboardingProgress: defineTable({
    userId: v.id("users"),
    currentStep: v.number(), // 1-5
    completedSteps: v.array(v.number()),
    skippedSteps: v.array(v.number()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    lastUpdatedAt: v.number(),
  }).index("userId", ["userId"]),

  // Phase 2: Action History (For rewind feature)
  actionHistory: defineTable({
    userId: v.id("users"),
    action: v.string(), // "like", "pass", "superLike"
    targetUserId: v.id("users"),
    timestamp: v.number(),
    canRewind: v.boolean(),
  })
    .index("userId", ["userId"])
    .index("userTimestamp", ["userId", "timestamp"])
    .index("targetUser", ["targetUserId"]),

  // Phase 3: Gamification & Engagement

  // Top Picks Cache (daily curated matches)
  topPicksCache: defineTable({
    userId: v.id("users"),
    picks: v.array(v.id("users")), // Array of user IDs
    generatedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("expiresAt", ["expiresAt"]),

  // User Progress (XP and Level system)
  userProgress: defineTable({
    userId: v.id("users"),
    level: v.number(), // User level (1-100)
    xp: v.number(), // Total XP earned
    badges: v.array(v.string()), // Array of badge IDs earned
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("level", ["level"]),

  // Daily Quests
  quests: defineTable({
    userId: v.id("users"),
    questType: v.string(), // "complete_profile", "send_messages", "swipe_profiles", etc.
    progress: v.number(), // Current progress
    target: v.number(), // Target to complete quest
    xpReward: v.number(), // XP awarded on completion
    completedAt: v.optional(v.number()),
    expiresAt: v.number(), // Quest expires at end of day
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("userCompleted", ["userId", "completedAt"])
    .index("expiresAt", ["expiresAt"]),

  // Activity Log (for analytics and stats)
  activityLog: defineTable({
    userId: v.id("users"),
    activityType: v.string(), // "profile_view", "swipe", "message_sent", "match", etc.
    metadata: v.optional(v.any()), // Additional data
    timestamp: v.number(),
  })
    .index("userId", ["userId"])
    .index("activityType", ["activityType"])
    .index("userTimestamp", ["userId", "timestamp"]),

  // Badges (achievement definitions)
  badgeDefinitions: defineTable({
    badgeId: v.string(), // Unique badge identifier
    name: v.string(),
    description: v.string(),
    icon: v.string(), // Emoji or icon name
    category: v.string(), // "verification", "activity", "achievement"
    rarity: v.string(), // "common", "rare", "epic", "legendary"
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("badgeId", ["badgeId"])
    .index("category", ["category"])
    .index("active", ["isActive"]),

  // Phase 4: Photo Performance Analytics
  photoAnalytics: defineTable({
    photoId: v.id("photos"),
    userId: v.id("users"),
    impressions: v.number(), // How many times shown
    likes: v.number(), // Likes received when this photo was primary
    passes: v.number(), // Passes when this photo was primary
    likeRate: v.number(), // likes / impressions
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("photoId", ["photoId"])
    .index("userId", ["userId"])
    .index("likeRate", ["likeRate"]),

  // Phase 3: Push Notifications
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    platform: v.union(
      v.literal("web"),
      v.literal("android"),
      v.literal("ios")
    ),
    browser: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    lastUsedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("endpoint", ["endpoint"]),

  // Phase 4: Account Management & GDPR Compliance
  accountDeletions: defineTable({
    userId: v.id("users"),
    requestedAt: v.number(),
    scheduledFor: v.number(), // 30 days grace period
    reason: v.optional(v.string()),
    feedback: v.optional(v.string()),
    status: v.union(
      v.literal("pending"), // Grace period
      v.literal("cancelled"), // User changed mind
      v.literal("completed") // Fully deleted
    ),
    completedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("scheduledFor", ["scheduledFor"])
    .index("status", ["status"]),

  dataExports: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("expired")
    ),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    requestedAt: v.number(),
    completedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    downloadedAt: v.optional(v.number()),
  }).index("userId", ["userId"]),

  // Status Posts (WhatsApp-style stories)
  statusPosts: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video")
    ),
    content: v.optional(v.string()), // Text content or media URL
    textContent: v.optional(v.string()), // Text overlay on media
    backgroundColor: v.optional(v.string()), // For text-only posts
    font: v.optional(v.string()), // Font style for text posts
    duration: v.optional(v.number()), // Video duration in seconds
    mediaUrl: v.optional(v.string()), // Image or video URL
    createdAt: v.number(),
    expiresAt: v.number(), // 24 hours from creation
  })
    .index("userId", ["userId"])
    .index("expiresAt", ["expiresAt"])
    .index("userCreatedAt", ["userId", "createdAt"]),

  // Status Views (who viewed which status)
  statusViews: defineTable({
    statusId: v.id("statusPosts"),
    viewerId: v.id("users"),
    statusOwnerId: v.id("users"), // Denormalized for faster queries
    viewedAt: v.number(),
  })
    .index("statusId", ["statusId"])
    .index("viewerId", ["viewerId"])
    .index("statusViewer", ["statusId", "viewerId"])
    .index("ownerId", ["statusOwnerId"]),

  // Status Likes (who liked which status)
  statusLikes: defineTable({
    statusId: v.id("statusPosts"),
    userId: v.id("users"),
    statusOwnerId: v.id("users"), // Denormalized for faster queries
    createdAt: v.number(),
  })
    .index("statusId", ["statusId"])
    .index("userId", ["userId"])
    .index("statusUser", ["statusId", "userId"])
    .index("ownerId", ["statusOwnerId"]),

  // Item Unlock System (Quota-based)
  itemUnlocks: defineTable({
    userId: v.id("users"),
    targetId: v.string(), // Can be userId (for profiles/likes) or matchId
    itemType: v.union(v.literal("profile"), v.literal("match"), v.literal("like")),
    unlockedAt: v.number(),
    unlockMethod: v.string(), // "free_quota" | "subscription_quota" | "paid_unlock"
    cost: v.optional(v.number()), // KES amount if paid
    paymentId: v.optional(v.id("payments")),
  })
    .index("userId", ["userId"])
    .index("userItem", ["userId", "itemType", "targetId"])
    .index("userType", ["userId", "itemType"]),

  // Activity Stats for response rates and engagement
  activityStats: defineTable({
    userId: v.id("users"),
    lastActiveAt: v.number(),
    totalActiveDays: v.number(),
    totalMessagesReceived: v.number(),
    totalMessagesResponded: v.number(),
    averageResponseTimeMinutes: v.number(),
  })
    .index("userId", ["userId"]),

  // Profile Views Tracking
  profileViews: defineTable({
    viewerUserId: v.id("users"),
    viewedUserId: v.id("users"),
    viewedAt: v.number(),
    viewCount: v.number(),
  })
    .index("viewedUser_viewer", ["viewedUserId", "viewerUserId"])
    .index("viewedUser_time", ["viewedUserId", "viewedAt"])
    .index("viewer", ["viewerUserId"]),

  // Pending Message Responses (for response time tracking)
  pendingResponses: defineTable({
    matchId: v.id("matches"),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    sentAt: v.number(),
    responded: v.boolean(),
    respondedAt: v.optional(v.number()),
  })
    .index("matchId_receiver", ["matchId", "receiverId"])
    .index("receiver", ["receiverId"]),

  // Login Streaks
  loginStreaks: defineTable({
    userId: v.id("users"),
    currentStreak: v.number(),
    longestStreak: v.number(),
    totalLogins: v.number(),
    lastClaimDate: v.number(), // Timestamp of last claimed day
  })
    .index("userId", ["userId"])
    .index("longestStreak", ["longestStreak"]),

  // Boost Credits (from daily rewards)
  boostCredits: defineTable({
    userId: v.id("users"),
    credits: v.number(),
    lastGranted: v.number(),
  })
    .index("userId", ["userId"]),

  // Unlock Credits (from daily rewards)
  unlockCredits: defineTable({
    userId: v.id("users"),
    credits: v.number(),
    lastGranted: v.number(),
  })
    .index("userId", ["userId"]),

  // Profile Boosts
  profileBoosts: defineTable({
    userId: v.id("users"),
    startedAt: v.number(),
    endsAt: v.number(),
    status: v.string(), // "active" | "expired"
    boostType: v.string(), // "free" | "paid"
  })
    .index("userId", ["userId"])
    .index("status_ends", ["status", "endsAt"]),

});
