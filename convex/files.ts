import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as Id<"_storage">);
  },
});

export const deleteFile = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId as Id<"_storage">);
    return { ok: true };
  },
});
