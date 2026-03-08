import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function splitName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  if (!normalized) return { name: "", surname: "" };
  const parts = normalized.split(" ");
  if (parts.length === 1) return { name: parts[0], surname: "" };
  return {
    name: parts.slice(0, -1).join(" "),
    surname: parts.at(-1) ?? "",
  };
}

function hasCompletedOnboarding(profile: { zipCode?: string }) {
  return Boolean(profile.zipCode?.trim());
}

export const getAuthUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const authUser = await ctx.db
      .query("authUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();
    if (!authUser) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_legacy_id", (q) => q.eq("id", authUser.profileId))
      .unique();
    return {
      ...authUser,
      needsOnboarding: !profile || !hasCompletedOnboarding(profile),
    };
  },
});

export const getAuthUserByProfileId = query({
  args: { profileId: v.string() },
  handler: async (ctx, args) => {
    const authUser = await ctx.db
      .query("authUsers")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .unique();
    if (!authUser) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_legacy_id", (q) => q.eq("id", authUser.profileId))
      .unique();
    return {
      ...authUser,
      needsOnboarding: !profile || !hasCompletedOnboarding(profile),
    };
  },
});

export const getAuthIdentity = query({
  args: {
    provider: v.string(),
    providerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("authIdentities")
      .withIndex("by_provider_providerUserId", (q) =>
        q.eq("provider", args.provider).eq("providerUserId", args.providerUserId)
      )
      .unique();
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    surname: v.optional(v.string()),
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
      surname: args.surname?.trim() || undefined,
      zipCode: undefined,
      phone: undefined,
      addressLine1: undefined,
      addressLine2: undefined,
      phoneConsent: false,
      emailNotifications: true,
      onboardingCompletedAt: undefined,
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

    return { profileId, email, needsOnboarding: true };
  },
});

export const upsertOAuthUser = mutation({
  args: {
    provider: v.string(),
    providerUserId: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.optional(v.string()),
    surname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const now = Date.now();
    const existingIdentity = await ctx.db
      .query("authIdentities")
      .withIndex("by_provider_providerUserId", (q) =>
        q.eq("provider", args.provider).eq("providerUserId", args.providerUserId)
      )
      .unique();

    if (existingIdentity) {
      const authUser = await ctx.db
        .query("authUsers")
        .withIndex("by_profileId", (q) => q.eq("profileId", existingIdentity.profileId))
        .unique();
      if (!authUser) throw new Error("AUTH_USER_NOT_FOUND");

      await ctx.db.patch(existingIdentity._id, {
        email,
        emailVerified: args.emailVerified,
        updatedAt: now,
      });
      await ctx.db.patch(authUser._id, {
        email,
        emailVerified: authUser.emailVerified || args.emailVerified,
        updatedAt: now,
      });

      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_legacy_id", (q) => q.eq("id", authUser.profileId))
        .unique();
      return {
        profileId: authUser.profileId,
        email: authUser.email,
        isNewUser: false,
        needsOnboarding: !profile || !hasCompletedOnboarding(profile),
      };
    }

    const existingAuth = await ctx.db
      .query("authUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingAuth) {
      await ctx.db.insert("authIdentities", {
        profileId: existingAuth.profileId,
        provider: args.provider,
        providerUserId: args.providerUserId,
        email,
        emailVerified: args.emailVerified,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.patch(existingAuth._id, {
        emailVerified: existingAuth.emailVerified || args.emailVerified,
        updatedAt: now,
      });

      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_legacy_id", (q) => q.eq("id", existingAuth.profileId))
        .unique();
      return {
        profileId: existingAuth.profileId,
        email: existingAuth.email,
        isNewUser: false,
        needsOnboarding: !profile || !hasCompletedOnboarding(profile),
      };
    }

    const fallbackName = splitName(args.name ?? "");
    const profileId = crypto.randomUUID();
    const name = (args.name ?? fallbackName.name).trim() || "Google";
    const surname = (args.surname ?? fallbackName.surname).trim();

    await ctx.db.insert("profiles", {
      id: profileId,
      name,
      surname: surname || undefined,
      zipCode: undefined,
      phone: undefined,
      addressLine1: undefined,
      addressLine2: undefined,
      phoneConsent: false,
      emailNotifications: true,
      onboardingCompletedAt: undefined,
      lastMessageEmailAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("authUsers", {
      id: crypto.randomUUID(),
      profileId,
      email,
      emailVerified: args.emailVerified,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("authIdentities", {
      profileId,
      provider: args.provider,
      providerUserId: args.providerUserId,
      email,
      emailVerified: args.emailVerified,
      createdAt: now,
      updatedAt: now,
    });

    return { profileId, email, isNewUser: true, needsOnboarding: true };
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
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_legacy_id", (q) => q.eq("id", authUser.profileId))
      .unique();
    return {
      profileId: authUser.profileId,
      email: authUser.email,
      needsOnboarding: !profile || !hasCompletedOnboarding(profile),
    };
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

export const createEmailLoginCode = mutation({
  args: {
    email: v.string(),
    codeHash: v.string(),
    name: v.optional(v.string()),
    surname: v.optional(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existingCodes = await ctx.db
      .query("emailLoginCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .collect();

    await Promise.all(
      existingCodes
        .filter((code) => !code.usedAt && code.expiresAt >= now)
        .map((code) => ctx.db.patch(code._id, { usedAt: now }))
    );

    await ctx.db.insert("emailLoginCodes", {
      email: args.email.toLowerCase(),
      codeHash: args.codeHash,
      name: args.name?.trim() || undefined,
      surname: args.surname?.trim() || undefined,
      expiresAt: args.expiresAt,
      createdAt: now,
    });

    return { ok: true };
  },
});

export const consumeEmailLoginCode = mutation({
  args: {
    email: v.string(),
    codeHash: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const codeRow = await ctx.db
      .query("emailLoginCodes")
      .withIndex("by_codeHash", (q) => q.eq("codeHash", args.codeHash))
      .unique();
    if (!codeRow || codeRow.email !== email) throw new Error("INVALID_CODE");
    if (codeRow.usedAt) throw new Error("CODE_USED");
    if (codeRow.expiresAt < Date.now()) throw new Error("CODE_EXPIRED");

    await ctx.db.patch(codeRow._id, { usedAt: Date.now() });

    const existingAuth = await ctx.db
      .query("authUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingAuth) {
      await ctx.db.patch(existingAuth._id, {
        emailVerified: true,
        updatedAt: Date.now(),
      });
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_legacy_id", (q) => q.eq("id", existingAuth.profileId))
        .unique();
      return {
        profileId: existingAuth.profileId,
        email: existingAuth.email,
        needsOnboarding: !profile || !hasCompletedOnboarding(profile),
        createdAccount: false,
      };
    }

    if (!codeRow.name?.trim()) throw new Error("SIGNUP_NAME_REQUIRED");

    const now = Date.now();
    const profileId = crypto.randomUUID();
    await ctx.db.insert("profiles", {
      id: profileId,
      name: codeRow.name.trim(),
      surname: codeRow.surname?.trim() || undefined,
      zipCode: undefined,
      phone: undefined,
      addressLine1: undefined,
      addressLine2: undefined,
      phoneConsent: false,
      emailNotifications: true,
      onboardingCompletedAt: undefined,
      lastMessageEmailAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("authUsers", {
      id: crypto.randomUUID(),
      profileId,
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      profileId,
      email,
      needsOnboarding: true,
      createdAccount: true,
    };
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
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_legacy_id", (q) => q.eq("id", authUser.profileId))
      .unique();
    return {
      profileId: authUser.profileId,
      email: authUser.email,
      needsOnboarding: !profile || !hasCompletedOnboarding(profile),
    };
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
    const identities = await ctx.db
      .query("authIdentities")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .collect();
    await Promise.all(identities.map((identity) => ctx.db.delete(identity._id)));
    return { ok: true };
  },
});

export const claimLegacyProfile = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    surname: v.string(),
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
    const normalizedPhone = args.phone.replace(/\s+/g, "");

    const candidates = profiles.filter((profile) => {
      const profilePhone = (profile.phone ?? "").replace(/\s+/g, "");
      return (
        profile.name.trim().toLowerCase() === normalizedName &&
        (profile.surname ?? "").trim().toLowerCase() === normalizedSurname &&
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

    return {
      profileId: profile.id,
      email,
      needsOnboarding: !hasCompletedOnboarding(profile),
    };
  },
});
