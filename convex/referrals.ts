import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DAILY_INVITE_LIMIT = 20;

function isProfileActivated(profile: {
  onboardingCompletedAt?: number;
  referralInviteId?: string;
  referralActivatedAt?: number;
}) {
  return Boolean(
    profile.onboardingCompletedAt &&
      profile.referralInviteId &&
      !profile.referralActivatedAt
  );
}

export const getInviteById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("referralInvites")
      .withIndex("by_inviteId", (q) => q.eq("id", args.id))
      .unique();
  },
});

export const getSummary = query({
  args: { profileId: v.string() },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("referralInvites")
      .withIndex("by_inviterProfileId_createdAt", (q) => q.eq("inviterProfileId", args.profileId))
      .order("desc")
      .collect();

    const recent = await Promise.all(
      invites.slice(0, 6).map(async (invite) => {
        const invitedProfile = invite.invitedProfileId
          ? await ctx.db
              .query("profiles")
              .withIndex("by_legacy_id", (q) => q.eq("id", invite.invitedProfileId!))
              .unique()
          : null;

        return {
          id: invite.id,
          status: invite.status as "invited" | "signed_up" | "activated",
          channel: invite.channel ?? null,
          createdAt: invite.createdAt,
          signedUpAt: invite.signedUpAt ?? null,
          activatedAt: invite.activatedAt ?? null,
          invitedName: invitedProfile?.name ?? null,
        };
      })
    );

    const activatedCount = invites.filter((invite) => invite.status === "activated").length;
    const signedUpCount = invites.filter((invite) => invite.status === "signed_up" || invite.status === "activated").length;

    return {
      inviteCount: invites.length,
      signedUpCount,
      activatedCount,
      hasSupporterBadge: activatedCount > 0,
      nextPerkAt: activatedCount > 0 ? null : 1,
      recent,
    };
  },
});

export const createInvite = mutation({
  args: {
    inviterProfileId: v.string(),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const inviter = await ctx.db
      .query("profiles")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.inviterProfileId))
      .unique();
    if (!inviter) throw new Error("INVITER_NOT_FOUND");

    const dayAgo = Date.now() - 1000 * 60 * 60 * 24;
    const recentInvites = await ctx.db
      .query("referralInvites")
      .withIndex("by_inviterProfileId_createdAt", (q) => q.eq("inviterProfileId", args.inviterProfileId))
      .order("desc")
      .collect();

    const last24Hours = recentInvites.filter((invite) => invite.createdAt >= dayAgo);
    if (last24Hours.length >= DAILY_INVITE_LIMIT) {
      throw new Error("RATE_LIMITED");
    }

    const id = crypto.randomUUID();
    await ctx.db.insert("referralInvites", {
      id,
      inviterProfileId: args.inviterProfileId,
      status: "invited",
      channel: args.channel?.trim() || undefined,
      createdAt: Date.now(),
    });

    return { inviteId: id };
  },
});

export const markActivated = mutation({
  args: {
    profileId: v.string(),
    trigger: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.profileId))
      .unique();
    if (!profile || !isProfileActivated(profile)) {
      return { activated: false, reason: "not_eligible" };
    }

    const invite = await ctx.db
      .query("referralInvites")
      .withIndex("by_inviteId", (q) => q.eq("id", profile.referralInviteId!))
      .unique();
    if (!invite) {
      return { activated: false, reason: "invite_missing" };
    }

    const now = Date.now();
    await ctx.db.patch(profile._id, {
      referralActivatedAt: profile.referralActivatedAt ?? now,
      updatedAt: now,
    });
    await ctx.db.patch(invite._id, {
      status: "activated",
      activatedAt: invite.activatedAt ?? now,
    });

    return { activated: true, trigger: args.trigger };
  },
});
