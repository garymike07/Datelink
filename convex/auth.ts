import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { insertNotification } from "./notifications";

// Generate a random session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash password function (simple implementation - in production, use bcrypt)
async function hashPassword(password: string): Promise<string> {
  // This is a simple hash - in production, use a proper hashing library
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password function
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// Sign up mutation
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash the password
    const hashedPassword = await hashPassword(args.password);

    // Create new user
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email,
      password: hashedPassword,
      name: args.name,
      phone: args.phone,
      isVerified: false, // In production, implement email verification
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Failed to create user");
    }

    // Create session token
    const token = generateSessionToken();
    const sessionExpiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days
    
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: sessionExpiresAt,
      createdAt: now,
      lastAccessedAt: now,
    });

    const userWithoutPassword = {
      _id: user._id,
      _creationTime: user._creationTime,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      success: true,
      user: userWithoutPassword,
      token,
      message: "Account created successfully",
    };
  },
});

// Login mutation
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    rememberMe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);

    // Find user by email (normalized)
    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    // Backward-compat fallback for legacy rows where email wasn't normalized
    if (!user && args.email !== email) {
      user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .first();
    }

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await verifyPassword(args.password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    // Create session token
    const now = Date.now();
    const token = generateSessionToken();
    // Set session expiration based on rememberMe flag
    // If rememberMe is true: 30 days, otherwise: 1 day
    const sessionDuration = args.rememberMe ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000);
    const sessionExpiresAt = now + sessionDuration;
    
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: sessionExpiresAt,
      createdAt: now,
      lastAccessedAt: now,
    });

    // Update last seen
    await ctx.db.patch(user._id, {
      lastSeenAt: now,
      updatedAt: now,
    });

    // In-app notification for successful login
    await insertNotification(ctx, {
      userId: user._id,
      type: "login_success",
      title: "Login successful",
      body: "Welcome back!",
      priority: "low",
      category: "system",
      icon: "✅",
      link: "/dashboard",
    });

    // Return user data without password
    const userWithoutPassword = {
      _id: user._id,
      _creationTime: user._creationTime,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      success: true,
      user: userWithoutPassword,
      token,
      message: "Login successful",
    };
  },
});

// Validate session and get current user
export const validateSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      return null;
    }

    // Check if session is expired
    const now = Date.now();
    if (session.expiresAt < now) {
      // Session is expired, return null (cleanup will happen elsewhere)
      return null;
    }

    // Get user data
    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    // Return user data without password
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

// Update session last accessed time
export const updateSessionActivity = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      return { success: false };
    }

    // Check if session is expired
    const now = Date.now();
    if (session.expiresAt < now) {
      await ctx.db.delete(session._id);
      return { success: false };
    }

    // Update last accessed time
    await ctx.db.patch(session._id, {
      lastAccessedAt: now,
    });

    return { success: true };
  },
});

// Logout - delete session
export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      const now = Date.now();
      await ctx.db.patch(session.userId, {
        lastSeenAt: now,
        updatedAt: now,
      });

      const presence = await ctx.db
        .query("presence")
        .withIndex("userId", (q: any) => q.eq("userId", session.userId))
        .first();

      if (presence) {
        await ctx.db.patch(presence._id, {
          status: "offline",
          lastActiveAt: now,
          updatedAt: now,
        });
      }

      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Logout all sessions for a user
export const logoutAll = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    const now = Date.now();
    await ctx.db.patch(args.userId, {
      lastSeenAt: now,
      updatedAt: now,
    });

    const presence = await ctx.db
      .query("presence")
      .withIndex("userId", (q: any) => q.eq("userId", args.userId))
      .first();

    if (presence) {
      await ctx.db.patch(presence._id, {
        status: "offline",
        lastActiveAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Get current user query (for authenticated routes) - DEPRECATED, use validateSession instead
export const getCurrentUser = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return null;
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Return user data without password
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

// Update user profile mutation
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updateData } = args;
    
    // Check if user exists
    const existingUser = await ctx.db.get(userId);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Update user
    await ctx.db.patch(userId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    // Fetch the updated user
    const updatedUser = await ctx.db.get(userId);
    if (!updatedUser) {
      throw new Error("Failed to update user");
    }

    // Return user data without password
    return {
      _id: updatedUser._id,
      _creationTime: updatedUser._creationTime,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  },
});

// Check if email exists query
export const checkEmailExists = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    
    return !!user;
  },
});

// Update last seen timestamp (for chat presence)
export const updateLastSeen = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db.get(args.userId);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.userId, {
      lastSeenAt: now,
      updatedAt: now,
    });

    return { success: true, lastSeenAt: now };
  },
});

export const changeEmail = mutation({
  args: {
    userId: v.id("users"),
    newEmail: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await verifyPassword(args.password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid password");
    }

    const existingEmailUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.newEmail))
      .first();

    if (existingEmailUser && existingEmailUser._id !== args.userId) {
      throw new Error("User with this email already exists");
    }

    const now = Date.now();
    await ctx.db.patch(args.userId, {
      email: args.newEmail,
      updatedAt: now,
    });

    const updatedUser = await ctx.db.get(args.userId);
    if (!updatedUser) {
      throw new Error("Failed to update user");
    }

    return {
      success: true,
      user: {
        _id: updatedUser._id,
        _creationTime: updatedUser._creationTime,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    };
  },
});

export const changePassword = mutation({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await verifyPassword(args.currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid current password");
    }

    const hashedPassword = await hashPassword(args.newPassword);
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      password: hashedPassword,
      updatedAt: now,
    });

    return { success: true };
  },
});
