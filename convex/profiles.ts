import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.id))
      .unique();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("profiles").order("desc").collect();
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    surname: v.optional(v.string()),
    residency: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.union(v.string(), v.null())),
    avatarStorageId: v.optional(v.union(v.string(), v.null())),
    emailNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.id))
      .unique();
    if (!profile) throw new Error("Profile not found");

    const oldAvatarStorageId = profile.avatarStorageId;
    await ctx.db.patch(profile._id, {
      name: args.name ?? profile.name,
      surname: args.surname ?? profile.surname,
      residency: args.residency ?? profile.residency,
      phone: args.phone ?? profile.phone,
      avatarUrl: args.avatarUrl === undefined ? profile.avatarUrl : args.avatarUrl ?? undefined,
      avatarStorageId:
        args.avatarStorageId === undefined
          ? profile.avatarStorageId
          : args.avatarStorageId ?? undefined,
      emailNotifications: args.emailNotifications ?? profile.emailNotifications,
      updatedAt: Date.now(),
    });
    return { ok: true, oldAvatarStorageId };
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.id))
      .unique();
    if (!profile) return { ok: true };

    const children = await ctx.db
      .query("children")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.id))
      .collect();
    for (const child of children) await ctx.db.delete(child._id);

    if (profile.avatarStorageId) {
      await ctx.storage.delete(profile.avatarStorageId as Id<"_storage">);
    }

    const items = await ctx.db
      .query("items")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.id))
      .collect();
    for (const item of items) {
      if (item.imageStorageId) await ctx.storage.delete(item.imageStorageId as Id<"_storage">);
      await ctx.db.delete(item._id);
    }

    const reservations = await ctx.db
      .query("reservations")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.id))
      .collect();
    for (const reservation of reservations) await ctx.db.delete(reservation._id);

    const buyerConversations = await ctx.db
      .query("conversations")
      .withIndex("by_buyerId_updatedAt", (q) => q.eq("buyerId", args.id))
      .collect();
    const sellerConversations = await ctx.db
      .query("conversations")
      .withIndex("by_sellerId_updatedAt", (q) => q.eq("sellerId", args.id))
      .collect();
    const allConversations = [...buyerConversations, ...sellerConversations];
    for (const conv of allConversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", conv.id))
        .collect();
      for (const msg of messages) await ctx.db.delete(msg._id);
      await ctx.db.delete(conv._id);
    }

    await ctx.db.delete(profile._id);
    return { ok: true };
  },
});
