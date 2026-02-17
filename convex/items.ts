import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const listAvailable = query({
  args: {
    q: v.optional(v.string()),
    category: v.optional(v.string()),
    pricing: v.optional(v.string()),
    size: v.optional(v.string()),
    shoeSize: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let rows = await ctx.db
      .query("items")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "available"))
      .order("desc")
      .collect();

    if (args.category) rows = rows.filter((r) => r.category === args.category);
    if (args.pricing) rows = rows.filter((r) => r.pricingType === args.pricing);
    if (args.size) rows = rows.filter((r) => r.size === args.size);
    if (args.shoeSize) rows = rows.filter((r) => r.shoeSize === args.shoeSize);
    if (args.q?.trim()) {
      const q = args.q.trim().toLowerCase();
      rows = rows.filter(
        (r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      );
    }

    const limit = args.limit ?? 40;
    return rows.slice(0, limit);
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.id))
      .unique();
  },
});

export const listBySeller = query({
  args: {
    sellerId: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let rows = await ctx.db
      .query("items")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .order("desc")
      .collect();
    if (args.status) rows = rows.filter((row) => row.status === args.status);
    return rows;
  },
});

export const countBySeller = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("items")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .collect();
    return rows.length;
  },
});

export const reserve = mutation({
  args: {
    id: v.string(),
    buyerId: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("items")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.id))
      .unique();
    if (!item) throw new Error("Item not found");
    if (item.sellerId === args.buyerId) throw new Error("Cannot reserve own item");
    if (item.status !== "available") throw new Error("Item is not available");

    const active = await ctx.db
      .query("reservations")
      .withIndex("by_itemId_status", (q) => q.eq("itemId", args.id).eq("status", "active"))
      .unique();
    if (active) throw new Error("Item already reserved");

    const now = Date.now();
    await ctx.db.insert("reservations", {
      id: crypto.randomUUID(),
      itemId: args.id,
      buyerId: args.buyerId,
      status: "active",
      createdAt: now,
      expiresAt: now + 1000 * 60 * 60 * 48,
    });
    await ctx.db.patch(item._id, {
      status: "reserved",
      updatedAt: now,
    });
    return { ok: true };
  },
});

export const create = mutation({
  args: {
    id: v.string(),
    sellerId: v.string(),
    title: v.string(),
    description: v.string(),
    pricingType: v.string(),
    pricingDetail: v.optional(v.string()),
    category: v.string(),
    size: v.optional(v.string()),
    shoeSize: v.optional(v.string()),
    imageUrl: v.string(),
    imageStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("items", {
      id: args.id,
      sellerId: args.sellerId,
      title: args.title,
      description: args.description,
      pricingType: args.pricingType,
      pricingDetail: args.pricingDetail,
      category: args.category,
      size: args.size,
      shoeSize: args.shoeSize,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId,
      status: "available",
      createdAt: now,
      updatedAt: now,
    });
    return { id: args.id };
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    actorId: v.string(),
    title: v.string(),
    description: v.string(),
    pricingType: v.string(),
    pricingDetail: v.optional(v.string()),
    category: v.string(),
    size: v.optional(v.string()),
    shoeSize: v.optional(v.string()),
    imageUrl: v.string(),
    imageStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("items")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.id))
      .unique();
    if (!item) throw new Error("Item not found");
    if (item.sellerId !== args.actorId) throw new Error("Unauthorized");

    const oldStorageId = item.imageStorageId;
    await ctx.db.patch(item._id, {
      title: args.title,
      description: args.description,
      pricingType: args.pricingType,
      pricingDetail: args.pricingDetail,
      category: args.category,
      size: args.size,
      shoeSize: args.shoeSize,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId,
      updatedAt: Date.now(),
    });
    return { ok: true, oldStorageId };
  },
});

export const remove = mutation({
  args: {
    id: v.string(),
    actorId: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("items")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.id))
      .unique();
    if (!item) throw new Error("Item not found");
    if (item.sellerId !== args.actorId) throw new Error("Unauthorized");

    const reservations = await ctx.db
      .query("reservations")
      .withIndex("by_itemId_status", (q) => q.eq("itemId", args.id).eq("status", "active"))
      .collect();
    for (const row of reservations) await ctx.db.delete(row._id);

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_itemId_buyerId", (q) => q.eq("itemId", args.id))
      .collect();
    for (const conv of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", conv.id))
        .collect();
      for (const msg of messages) await ctx.db.delete(msg._id);
      await ctx.db.delete(conv._id);
    }

    if (item.imageStorageId) {
      await ctx.storage.delete(item.imageStorageId as Id<"_storage">);
    }
    await ctx.db.delete(item._id);
    return { ok: true };
  },
});

export const cancelReservation = mutation({
  args: {
    id: v.string(),
    actorId: v.string(),
    reservationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("items")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.id))
      .unique();
    if (!item) throw new Error("Item not found");
    const active = await ctx.db
      .query("reservations")
      .withIndex("by_itemId_status", (q) => q.eq("itemId", args.id).eq("status", "active"))
      .unique();
    if (!active) return { ok: true };
    if (item.sellerId !== args.actorId && active.buyerId !== args.actorId) {
      throw new Error("Unauthorized");
    }

    if (args.reservationId && active.id !== args.reservationId) {
      throw new Error("Reservation mismatch");
    }
    await ctx.db.patch(active._id, { status: "cancelled" });
    await ctx.db.patch(item._id, { status: "available", updatedAt: Date.now() });
    return { ok: true };
  },
});
