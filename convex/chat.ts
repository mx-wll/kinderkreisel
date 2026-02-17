import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listConversations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const buyerConversations = await ctx.db
      .query("conversations")
      .withIndex("by_buyerId_updatedAt", (q) => q.eq("buyerId", args.userId))
      .order("desc")
      .collect();
    const sellerConversations = await ctx.db
      .query("conversations")
      .withIndex("by_sellerId_updatedAt", (q) => q.eq("sellerId", args.userId))
      .order("desc")
      .collect();

    const dedup = new Map<string, (typeof buyerConversations)[number]>();
    for (const row of [...buyerConversations, ...sellerConversations]) dedup.set(row.id, row);
    return Array.from(dedup.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getConversationById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.id))
      .unique();
  },
});

export const getMessages = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});

export const getLastMessage = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(1);
    return rows[0] ?? null;
  },
});

export const getUnreadCount = query({
  args: { conversationId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    return rows.filter((msg) => msg.senderId !== args.userId && !msg.readAt).length;
  },
});

export const getUnreadCountForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const buyer = await ctx.db
      .query("conversations")
      .withIndex("by_buyerId_updatedAt", (q) => q.eq("buyerId", args.userId))
      .collect();
    const seller = await ctx.db
      .query("conversations")
      .withIndex("by_sellerId_updatedAt", (q) => q.eq("sellerId", args.userId))
      .collect();
    const dedup = new Map<string, (typeof buyer)[number]>();
    for (const row of [...buyer, ...seller]) dedup.set(row.id, row);

    let count = 0;
    for (const conv of dedup.values()) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", conv.id))
        .collect();
      count += messages.filter((m) => m.senderId !== args.userId && !m.readAt).length;
    }
    return count;
  },
});

export const startConversation = mutation({
  args: {
    itemId: v.string(),
    buyerId: v.string(),
    sellerId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_itemId_buyerId", (q) => q.eq("itemId", args.itemId).eq("buyerId", args.buyerId))
      .unique();
    if (existing) return { id: existing.id };

    const now = Date.now();
    const id = crypto.randomUUID();
    await ctx.db.insert("conversations", {
      id,
      itemId: args.itemId,
      buyerId: args.buyerId,
      sellerId: args.sellerId,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.string(),
    senderId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.content.trim()) throw new Error("Message is empty");
    if (args.content.length > 2000) throw new Error("Message too long");

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.conversationId))
      .unique();
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.buyerId !== args.senderId && conversation.sellerId !== args.senderId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.insert("messages", {
      id: crypto.randomUUID(),
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      createdAt: Date.now(),
      readAt: undefined,
    });
    await ctx.db.patch(conversation._id, { updatedAt: Date.now() });
    return { ok: true };
  },
});

export const markConversationRead = mutation({
  args: { conversationId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    const now = Date.now();
    for (const msg of messages) {
      if (msg.senderId !== args.userId && !msg.readAt) {
        await ctx.db.patch(msg._id, { readAt: now });
      }
    }
    return { ok: true };
  },
});
