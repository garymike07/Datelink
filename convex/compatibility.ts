import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// ============================================================================
// COMPATIBILITY SCORING SYSTEM
// ============================================================================

export const calculateCompatibility = mutation({
  args: {
    userId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const score = await computeCompatibilityScore(ctx, args.userId, args.targetUserId);
    const weekKey = getWeekKey(new Date());

    // Check if score already exists for this week
    const existing = await ctx.db
      .query("compatibilityScores")
      .withIndex("userWeek", (q) => 
        q.eq("userId", args.userId).eq("weekKey", weekKey)
      )
      .filter((q) => q.eq(q.field("targetUserId"), args.targetUserId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        score: score.totalScore,
        factors: score.factors,
        calculatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("compatibilityScores", {
        userId: args.userId,
        targetUserId: args.targetUserId,
        score: score.totalScore,
        factors: score.factors,
        calculatedAt: Date.now(),
        weekKey,
      });
    }

    return score;
  },
});

export const getTopCompatibleThisWeek = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const weekKey = getWeekKey(new Date());

    // Get compatibility scores for this week
    const scores = await ctx.db
      .query("compatibilityScores")
      .withIndex("userWeek", (q) => 
        q.eq("userId", args.userId).eq("weekKey", weekKey)
      )
      .collect();

    // Get users I've already interacted with
    const myLikes = await ctx.db
      .query("likes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    const myPasses = await ctx.db
      .query("passes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    const myMatches = await ctx.db
      .query("matches")
      .withIndex("user1Id", (q) => q.eq("user1Id", args.userId))
      .collect();
    const myMatches2 = await ctx.db
      .query("matches")
      .withIndex("user2Id", (q) => q.eq("user2Id", args.userId))
      .collect();

    const seenUserIds = new Set([
      ...myLikes.map((l) => l.likedUserId),
      ...myPasses.map((p) => p.passedUserId),
      ...myMatches.map((m) => m.user2Id),
      ...myMatches2.map((m) => m.user1Id),
    ]);

    // Filter out already seen users and sort by score
    const availableScores = scores
      .filter((s) => !seenUserIds.has(s.targetUserId))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Build full profiles
    const profiles = [];
    for (const scoreEntry of availableScores) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("userId", (q) => q.eq("userId", scoreEntry.targetUserId))
        .first();

      if (!profile) continue;

      const user = await ctx.db.get(scoreEntry.targetUserId);
      const photos = await ctx.db
        .query("photos")
        .withIndex("userId", (q) => q.eq("userId", scoreEntry.targetUserId))
        .collect();

      if (user && photos.length > 0) {
        profiles.push({
          ...profile,
          name: user.name,
          photos: photos.sort((a, b) => a.order - b.order),
          compatibilityScore: Math.round(scoreEntry.score),
          compatibilityFactors: scoreEntry.factors,
          matchReason: getMatchReason(scoreEntry.factors),
        });
      }
    }

    return profiles;
  },
});

export const recalculateWeeklyScores = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const weekKey = getWeekKey(new Date());

    // Get user's preferences
    const preferences = await ctx.db
      .query("preferences")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!preferences) {
      console.warn(`User preferences not found for userId: ${args.userId}`);
      return { calculated: 0, weekKey, error: "User preferences not found" };
    }

    // Get user's profile
    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userProfile) {
      console.warn(`User profile not found for userId: ${args.userId}`);
      return { calculated: 0, weekKey, error: "User profile not found" };
    }

    // Get users I've already interacted with
    const myLikes = await ctx.db
      .query("likes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    const myPasses = await ctx.db
      .query("passes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    const myMatches = await ctx.db
      .query("matches")
      .withIndex("user1Id", (q) => q.eq("user1Id", args.userId))
      .collect();
    const myMatches2 = await ctx.db
      .query("matches")
      .withIndex("user2Id", (q) => q.eq("user2Id", args.userId))
      .collect();

    const seenUserIds = new Set([
      ...myLikes.map((l) => l.likedUserId),
      ...myPasses.map((p) => p.passedUserId),
      ...myMatches.map((m) => m.user2Id),
      ...myMatches2.map((m) => m.user1Id),
    ]);

    // Get all potential matches
    const allProfiles = await ctx.db
      .query("profiles")
      .collect();

    let calculated = 0;
    for (const profile of allProfiles) {
      // Skip self and already seen
      if (profile.userId === args.userId || seenUserIds.has(profile.userId)) {
        continue;
      }

      // Basic preference check
      if (profile.age < preferences.minAge || profile.age > preferences.maxAge) {
        continue;
      }

      if (!preferences.genderPreference.includes(profile.gender)) {
        continue;
      }

      // Check distance
      if (userProfile.latitude && userProfile.longitude && profile.latitude && profile.longitude) {
        const distance = calculateDistance(
          userProfile.latitude,
          userProfile.longitude,
          profile.latitude,
          profile.longitude
        );
        if (distance > preferences.maxDistance) {
          continue;
        }
      }

      // Calculate compatibility
      const score = await computeCompatibilityScore(ctx, args.userId, profile.userId);

      // Save score
      const existing = await ctx.db
        .query("compatibilityScores")
        .withIndex("userWeek", (q) => 
          q.eq("userId", args.userId).eq("weekKey", weekKey)
        )
        .filter((q) => q.eq(q.field("targetUserId"), profile.userId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          score: score.totalScore,
          factors: score.factors,
          calculatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("compatibilityScores", {
          userId: args.userId,
          targetUserId: profile.userId,
          score: score.totalScore,
          factors: score.factors,
          calculatedAt: Date.now(),
          weekKey,
        });
      }

      calculated++;

      // Limit to top 50 to avoid excessive computation
      if (calculated >= 50) break;
    }

    return { calculated, weekKey };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function computeCompatibilityScore(ctx: any, userId: any, targetUserId: any) {
  const myProfile = await ctx.db
    .query("profiles")
    .withIndex("userId", (q: any) => q.eq("userId", userId))
    .first();

  const targetProfile = await ctx.db
    .query("profiles")
    .withIndex("userId", (q: any) => q.eq("userId", targetUserId))
    .first();

  if (!myProfile || !targetProfile) {
    return { totalScore: 0, factors: { interestOverlap: 0, goalAlignment: 0, lifestyleMatch: 0, preferenceMatch: 0 } };
  }

  // 1. Interest Overlap (30%)
  const myInterests = await ctx.db
    .query("interests")
    .withIndex("userId", (q: any) => q.eq("userId", userId))
    .collect();
  const targetInterests = await ctx.db
    .query("interests")
    .withIndex("userId", (q: any) => q.eq("userId", targetUserId))
    .collect();

  const myInterestSet = new Set(myInterests.map((i: any) => i.interest));
  const targetInterestSet = new Set(targetInterests.map((i: any) => i.interest));
  const commonInterests = [...myInterestSet].filter(i => targetInterestSet.has(i));
  
  const maxInterests = Math.max(myInterestSet.size, targetInterestSet.size, 1);
  const interestOverlap = (commonInterests.length / maxInterests) * 30;

  // 2. Goal Alignment (25%)
  let goalAlignment = 0;
  if (myProfile.relationshipGoal && targetProfile.relationshipGoal) {
    if (myProfile.relationshipGoal === targetProfile.relationshipGoal) {
      goalAlignment = 25;
    } else if (
      (myProfile.relationshipGoal === "serious" && targetProfile.relationshipGoal === "marriage") ||
      (myProfile.relationshipGoal === "marriage" && targetProfile.relationshipGoal === "serious")
    ) {
      goalAlignment = 20;
    } else {
      goalAlignment = 5;
    }
  }

  // 3. Lifestyle Match (20%)
  let lifestyleMatch = 0;
  let lifestyleFactors = 0;

  if (myProfile.religion && targetProfile.religion) {
    lifestyleFactors++;
    if (myProfile.religion === targetProfile.religion) lifestyleMatch += 5;
  }
  if (myProfile.drinking && targetProfile.drinking) {
    lifestyleFactors++;
    if (myProfile.drinking === targetProfile.drinking) lifestyleMatch += 5;
    else if (
      (myProfile.drinking === "never" && targetProfile.drinking === "socially") ||
      (myProfile.drinking === "socially" && targetProfile.drinking === "never")
    ) {
      lifestyleMatch += 2;
    }
  }
  if (myProfile.smoking && targetProfile.smoking) {
    lifestyleFactors++;
    if (myProfile.smoking === targetProfile.smoking) lifestyleMatch += 5;
  }
  if (myProfile.exercise && targetProfile.exercise) {
    lifestyleFactors++;
    if (myProfile.exercise === targetProfile.exercise) lifestyleMatch += 5;
  }

  lifestyleMatch = lifestyleFactors > 0 ? (lifestyleMatch / lifestyleFactors) * 20 : 10;

  // 4. Preference Match (15%)
  const myPreferences = await ctx.db
    .query("preferences")
    .withIndex("userId", (q: any) => q.eq("userId", userId))
    .first();
  const targetPreferences = await ctx.db
    .query("preferences")
    .withIndex("userId", (q: any) => q.eq("userId", targetUserId))
    .first();

  let preferenceMatch = 0;
  if (myPreferences && targetPreferences) {
    // Check if we match each other's criteria
    let matches = 0;
    let checks = 0;

    // Age match
    checks += 2;
    if (targetProfile.age >= myPreferences.minAge && targetProfile.age <= myPreferences.maxAge) matches++;
    if (myProfile.age >= targetPreferences.minAge && myProfile.age <= targetPreferences.maxAge) matches++;

    // Gender match
    checks += 2;
    if (myPreferences.genderPreference.includes(targetProfile.gender)) matches++;
    if (targetPreferences.genderPreference.includes(myProfile.gender)) matches++;

    preferenceMatch = (matches / checks) * 15;
  }

  const totalScore = interestOverlap + goalAlignment + lifestyleMatch + preferenceMatch;

  return {
    totalScore: Math.round(totalScore),
    factors: {
      interestOverlap: Math.round(interestOverlap),
      goalAlignment: Math.round(goalAlignment),
      lifestyleMatch: Math.round(lifestyleMatch),
      preferenceMatch: Math.round(preferenceMatch),
    },
  };
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

function getMatchReason(factors: any): string {
  const reasons = [];
  
  if (factors.interestOverlap >= 20) {
    reasons.push("shared interests");
  }
  if (factors.goalAlignment >= 20) {
    reasons.push("similar relationship goals");
  }
  if (factors.lifestyleMatch >= 15) {
    reasons.push("compatible lifestyle");
  }
  
  if (reasons.length === 0) {
    return "Great match potential!";
  }
  
  return `You have ${reasons.join(", ")}`;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
