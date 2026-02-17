import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAuthUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("authUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();
  },
});

export const getAuthUserByProfileId = query({
  args: { profileId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("authUsers")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .unique();
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    surname: v.string(),
    residency: v.string(),
    phone: v.string(),
    phoneConsent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const existing = await ctx.db
      .query("authUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) throw new Error("EMAIL_EXISTS");

    const now = Date.now();
    const profileId = crypto.randomUUID();
    await ctx.db.insert("profiles", {
      id: profileId,
      name: args.name,
      surname: args.surname,
      residency: args.residency,
      zipCode: "83623",
      phone: args.phone,
      phoneConsent: args.phoneConsent,
      emailNotifications: true,
      lastMessageEmailAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("authUsers", {
      id: crypto.randomUUID(),
      profileId,
      email,
      passwordHash: args.passwordHash,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    return { profileId, email };
  },
});

export const updatePassword = mutation({
  args: { profileId: v.string(), passwordHash: v.string() },
  handler: async (ctx, args) => {
    const authUser = await ctx.db
      .query("authUsers")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .unique();
    if (!authUser) throw new Error("AUTH_USER_NOT_FOUND");
    await ctx.db.patch(authUser._id, {
      passwordHash: args.passwordHash,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const createEmailVerificationToken = mutation({
  args: {
    profileId: v.string(),
    tokenHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailVerifications", {
      tokenHash: args.tokenHash,
      profileId: args.profileId,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

export const consumeEmailVerificationToken = mutation({
  args: {
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRow = await ctx.db
      .query("emailVerifications")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();
    if (!tokenRow) throw new Error("INVALID_TOKEN");
    if (tokenRow.usedAt) throw new Error("TOKEN_USED");
    if (tokenRow.expiresAt < Date.now()) throw new Error("TOKEN_EXPIRED");

    const authUser = await ctx.db
      .query("authUsers")
      .withIndex("by_profileId", (q) => q.eq("profileId", tokenRow.profileId))
      .unique();
    if (!authUser) throw new Error("AUTH_USER_NOT_FOUND");

    await ctx.db.patch(authUser._id, {
      emailVerified: true,
      updatedAt: Date.now(),
    });
    await ctx.db.patch(tokenRow._id, { usedAt: Date.now() });
    return { profileId: authUser.profileId, email: authUser.email };
  },
});

export const markEmailVerified = mutation({
  args: { profileId: v.string() },
  handler: async (ctx, args) => {
    const authUser = await ctx.db
      .query("authUsers")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .unique();
    if (!authUser) throw new Error("AUTH_USER_NOT_FOUND");

    await ctx.db.patch(authUser._id, {
      emailVerified: true,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const createResetToken = mutation({
  args: {
    profileId: v.string(),
    tokenHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("passwordResets", {
      tokenHash: args.tokenHash,
      profileId: args.profileId,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

export const consumeResetToken = mutation({
  args: {
    tokenHash: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const reset = await ctx.db
      .query("passwordResets")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();
    if (!reset) throw new Error("INVALID_TOKEN");
    if (reset.usedAt) throw new Error("TOKEN_USED");
    if (reset.expiresAt < Date.now()) throw new Error("TOKEN_EXPIRED");

    const authUser = await ctx.db
      .query("authUsers")
      .withIndex("by_profileId", (q) => q.eq("profileId", reset.profileId))
      .unique();
    if (!authUser) throw new Error("AUTH_USER_NOT_FOUND");

    await ctx.db.patch(authUser._id, {
      passwordHash: args.passwordHash,
      updatedAt: Date.now(),
    });
    await ctx.db.patch(reset._id, { usedAt: Date.now() });
    return { profileId: authUser.profileId, email: authUser.email };
  },
});

export const deleteAuthUserByProfileId = mutation({
  args: { profileId: v.string() },
  handler: async (ctx, args) => {
    const authUser = await ctx.db
      .query("authUsers")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .unique();
    if (authUser) await ctx.db.delete(authUser._id);
    return { ok: true };
  },
});

export const claimLegacyProfile = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    surname: v.string(),
    residency: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const existingEmail = await ctx.db
      .query("authUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existingEmail) throw new Error("EMAIL_EXISTS");

    const profiles = await ctx.db.query("profiles").collect();
    const normalizedName = args.name.trim().toLowerCase();
    const normalizedSurname = args.surname.trim().toLowerCase();
    const normalizedResidency = args.residency.trim().toLowerCase();
    const normalizedPhone = args.phone.replace(/\s+/g, "");

    const candidates = profiles.filter((profile) => {
      const profilePhone = profile.phone.replace(/\s+/g, "");
      return (
        profile.name.trim().toLowerCase() === normalizedName &&
        profile.surname.trim().toLowerCase() === normalizedSurname &&
        profile.residency.trim().toLowerCase() === normalizedResidency &&
        profilePhone === normalizedPhone
      );
    });

    if (candidates.length !== 1) throw new Error("CLAIM_NOT_FOUND");
    const profile = candidates[0];

    const existingAuth = await ctx.db
      .query("authUsers")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile.id))
      .unique();
    if (existingAuth) throw new Error("ALREADY_CLAIMED");

    await ctx.db.insert("authUsers", {
      id: crypto.randomUUID(),
      profileId: profile.id,
      email,
      passwordHash: args.passwordHash,
      emailVerified: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { profileId: profile.id, email };
  },
});
