import { query } from "./_generated/server";
import { v } from "convex/values";

export const getActiveByItem = query({
  args: { itemId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reservations")
      .withIndex("by_itemId_status", (q) => q.eq("itemId", args.itemId).eq("status", "active"))
      .unique();
  },
});

export const listActiveByBuyer = query({
  args: { buyerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reservations")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();
  },
});
