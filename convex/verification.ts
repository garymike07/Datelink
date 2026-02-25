import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { insertNotification } from "./notifications";

export const submitVerification = mutation({
    args: {
        userId: v.id("users"),
        photos: v.array(
            v.object({
                url: v.string(),
                pose: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("verifications")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("type"), "photo"),
                    q.eq(q.field("status"), "pending")
                )
            )
            .first();

        if (existing) {
            throw new Error("You already have a pending verification request");
        }

        const now = Date.now();

        const verificationId = await ctx.db.insert("verifications", {
            userId: args.userId,
            type: "photo",
            status: "pending",
            verificationPhotos: args.photos,
            submittedAt: now,
        });

        // Send verification pending notification
        await insertNotification(ctx, {
            userId: args.userId,
            type: "verification_pending",
            title: "Verification Submitted",
            body: "Your verification photos are being reviewed. We'll notify you once it's complete!",
            priority: "medium",
            category: "system",
            icon: "⏳",
        });

        return verificationId;
    },
});

// Submit photo verification
export const submitPhotoVerification = mutation({
    args: {
        userId: v.id("users"),
        photoUrl: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if there's already a pending verification
        const existing = await ctx.db
            .query("verifications")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("type"), "photo"),
                    q.eq(q.field("status"), "pending")
                )
            )
            .first();

        if (existing) {
            throw new Error("You already have a pending verification request");
        }

        const now = Date.now();

        const verificationId = await ctx.db.insert("verifications", {
            userId: args.userId,
            type: "photo",
            status: "pending",
            photoUrl: args.photoUrl,
            submittedAt: now,
        });

        return verificationId;
    },
});

// Get verification status for a user
export const getVerificationStatus = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const verification = await ctx.db
            .query("verifications")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("type"), "photo"))
            .order("desc")
            .first();

        if (!verification) {
            return { status: "none", verified: false };
        }

        return {
            status: verification.status,
            verified: verification.status === "approved",
            submittedAt: verification.submittedAt,
            reviewedAt: verification.reviewedAt,
            reviewNotes: verification.reviewNotes,
        };
    },
});

// Check if user is verified
export const isUserVerified = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);

        if (!user) {
            return false;
        }

        return user.verificationStatus === "verified";
    },
});

// Approve verification (admin function - placeholder for future)
export const approveVerification = mutation({
    args: {
        verificationId: v.id("verifications"),
        adminUserId: v.id("users"), // For future admin authentication
    },
    handler: async (ctx, args) => {
        const verification = await ctx.db.get(args.verificationId);

        if (!verification) {
            throw new Error("Verification not found");
        }

        if (verification.status !== "pending") {
            throw new Error("Verification is not pending");
        }

        const now = Date.now();

        // Update verification status
        await ctx.db.patch(args.verificationId, {
            status: "approved",
            reviewedAt: now,
        });

        // Update user's verification status
        await ctx.db.patch(verification.userId, {
            verificationStatus: "verified",
        });

        // Send verification complete notification
        await insertNotification(ctx, {
            userId: verification.userId,
            type: "verification_complete",
            title: "Verification Approved! ✓",
            body: "Your profile has been verified! You now have the verified badge.",
            priority: "high",
            category: "system",
            icon: "✅",
            actionButtons: [
                { label: "View Profile", action: "navigate", link: "/profile" },
            ],
        });

        return { success: true };
    },
});

// Reject verification (admin function - placeholder for future)
export const rejectVerification = mutation({
    args: {
        verificationId: v.id("verifications"),
        adminUserId: v.id("users"), // For future admin authentication
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const verification = await ctx.db.get(args.verificationId);

        if (!verification) {
            throw new Error("Verification not found");
        }

        if (verification.status !== "pending") {
            throw new Error("Verification is not pending");
        }

        const now = Date.now();

        // Update verification status
        await ctx.db.patch(args.verificationId, {
            status: "rejected",
            reviewedAt: now,
            reviewNotes: args.reason,
        });

        // Send verification rejected notification
        await insertNotification(ctx, {
            userId: verification.userId,
            type: "verification_rejected",
            title: "Verification Rejected",
            body: args.reason || "Your verification was rejected. Please review the requirements and try again.",
            priority: "high",
            category: "system",
            icon: "❌",
            actionButtons: [
                { label: "Try Again", action: "navigate", link: "/photo-verification" },
            ],
        });

        return { success: true };
    },
});
