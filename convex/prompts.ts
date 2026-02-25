import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all active prompts
export const getActivePrompts = query({
    args: {},
    handler: async (ctx) => {
        const prompts = await ctx.db
            .query("prompts")
            .withIndex("active", (q) => q.eq("isActive", true))
            .collect();

        return prompts;
    },
});

// Get prompts by category
export const getPromptsByCategory = query({
    args: { category: v.string() },
    handler: async (ctx, args) => {
        const prompts = await ctx.db
            .query("prompts")
            .withIndex("category", (q) => q.eq("category", args.category))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        return prompts;
    },
});

// Get user's prompt answers
export const getUserPromptAnswers = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const answers = await ctx.db
            .query("promptAnswers")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        // Fetch the prompt text for each answer
        const answersWithPrompts = await Promise.all(
            answers.map(async (answer) => {
                const prompt = await ctx.db.get(answer.promptId);
                return {
                    ...answer,
                    promptText: prompt?.text || "",
                    promptCategory: prompt?.category || "",
                };
            })
        );

        // Sort by order
        answersWithPrompts.sort((a, b) => a.order - b.order);

        return answersWithPrompts;
    },
});

// Add or update prompt answer
export const addPromptAnswer = mutation({
    args: {
        userId: v.id("users"),
        promptId: v.id("prompts"),
        answer: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        // Get user's profile
        const profile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!profile) {
            throw new Error("Profile not found");
        }

        // Check if answer already exists for this prompt
        const existing = await ctx.db
            .query("promptAnswers")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("promptId"), args.promptId))
            .first();

        const now = Date.now();

        if (existing) {
            // Update existing answer
            await ctx.db.patch(existing._id, {
                answer: args.answer,
                order: args.order,
                updatedAt: now,
            });

            return existing._id;
        } else {
            // Create new answer
            const answerId = await ctx.db.insert("promptAnswers", {
                userId: args.userId,
                profileId: profile._id,
                promptId: args.promptId,
                answer: args.answer,
                order: args.order,
                createdAt: now,
                updatedAt: now,
            });

            return answerId;
        }
    },
});

// Update prompt answer
export const updatePromptAnswer = mutation({
    args: {
        answerId: v.id("promptAnswers"),
        userId: v.id("users"),
        answer: v.optional(v.string()),
        order: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.get(args.answerId);

        if (!existing) {
            throw new Error("Answer not found");
        }

        if (existing.userId !== args.userId) {
            throw new Error("Not authorized");
        }

        const updates: any = {
            updatedAt: Date.now(),
        };

        if (args.answer !== undefined) {
            updates.answer = args.answer;
        }

        if (args.order !== undefined) {
            updates.order = args.order;
        }

        await ctx.db.patch(args.answerId, updates);

        return args.answerId;
    },
});

// Delete prompt answer
export const deletePromptAnswer = mutation({
    args: {
        answerId: v.id("promptAnswers"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.get(args.answerId);

        if (!existing) {
            throw new Error("Answer not found");
        }

        if (existing.userId !== args.userId) {
            throw new Error("Not authorized");
        }

        await ctx.db.delete(args.answerId);

        return { success: true };
    },
});

// Seed initial prompts (run once to populate database)
export const seedPrompts = mutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        const prompts = [
            // Personality
            { text: "I'm looking for...", category: "personality", isActive: true },
            { text: "My ideal Sunday involves...", category: "personality", isActive: true },
            { text: "I'm weirdly attracted to...", category: "personality", isActive: true },
            { text: "The key to my heart is...", category: "personality", isActive: true },
            { text: "I geek out on...", category: "personality", isActive: true },

            // Lifestyle
            { text: "My perfect weekend looks like...", category: "lifestyle", isActive: true },
            { text: "I spend too much time...", category: "lifestyle", isActive: true },
            { text: "My go-to karaoke song is...", category: "lifestyle", isActive: true },
            { text: "I'm convinced that...", category: "lifestyle", isActive: true },
            { text: "My simple pleasures...", category: "lifestyle", isActive: true },

            // Dating
            { text: "The best way to ask me out is...", category: "dating", isActive: true },
            { text: "My love language is...", category: "dating", isActive: true },
            { text: "A perfect first date would be...", category: "dating", isActive: true },
            { text: "I know it's a good match when...", category: "dating", isActive: true },
            { text: "My most controversial opinion is...", category: "dating", isActive: true },

            // Fun
            { text: "Two truths and a lie...", category: "fun", isActive: true },
            { text: "I'll know I've made it when...", category: "fun", isActive: true },
            { text: "My hidden talent is...", category: "fun", isActive: true },
            { text: "The award I'd win is...", category: "fun", isActive: true },
            { text: "I'm secretly a...", category: "fun", isActive: true },
        ];

        for (const prompt of prompts) {
            await ctx.db.insert("prompts", {
                ...prompt,
                createdAt: now,
            });
        }

        return { count: prompts.length };
    },
});
