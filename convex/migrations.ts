import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const profileRow = v.object({
  id: v.string(),
  name: v.string(),
  surname: v.string(),
  residency: v.string(),
  zip_code: v.string(),
  phone: v.string(),
  avatar_url: v.union(v.string(), v.null()),
  phone_consent: v.boolean(),
  email_notifications: v.boolean(),
  last_message_email_at: v.union(v.string(), v.null()),
  created_at: v.string(),
  updated_at: v.string(),
});

const childRow = v.object({
  id: v.string(),
  profile_id: v.string(),
  age: v.union(v.number(), v.null()),
  gender: v.union(v.string(), v.null()),
  created_at: v.string(),
});

const itemRow = v.object({
  id: v.string(),
  seller_id: v.string(),
  title: v.string(),
  description: v.string(),
  pricing_type: v.string(),
  pricing_detail: v.union(v.string(), v.null()),
  category: v.string(),
  size: v.union(v.string(), v.null()),
  shoe_size: v.union(v.string(), v.null()),
  image_url: v.string(),
  status: v.string(),
  created_at: v.string(),
  updated_at: v.string(),
});

const reservationRow = v.object({
  id: v.string(),
  item_id: v.string(),
  buyer_id: v.string(),
  status: v.string(),
  created_at: v.string(),
  expires_at: v.string(),
});

const conversationRow = v.object({
  id: v.string(),
  item_id: v.string(),
  buyer_id: v.string(),
  seller_id: v.string(),
  created_at: v.string(),
  updated_at: v.string(),
});

const messageRow = v.object({
  id: v.string(),
  conversation_id: v.string(),
  sender_id: v.string(),
  content: v.string(),
  read_at: v.union(v.string(), v.null()),
  created_at: v.string(),
});

function toMs(iso: string | null): number {
  if (!iso) return Date.now();
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? value : Date.now();
}

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const tables: Array<
      "messages" | "conversations" | "reservations" | "items" | "children" | "profiles"
    > = ["messages", "conversations", "reservations", "items", "children", "profiles"];
    for (const table of tables) {
      for await (const row of ctx.db.query(table)) {
        await ctx.db.delete(row._id);
      }
    }
    return { ok: true };
  },
});

export const importProfiles = mutation({
  args: { rows: v.array(profileRow) },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      const data = {
        id: row.id,
        name: row.name,
        surname: row.surname,
        residency: row.residency,
        zipCode: row.zip_code,
        phone: row.phone,
        avatarUrl: row.avatar_url ?? undefined,
        phoneConsent: row.phone_consent,
        emailNotifications: row.email_notifications,
        lastMessageEmailAt: toMs(row.last_message_email_at),
        createdAt: toMs(row.created_at),
        updatedAt: toMs(row.updated_at),
      };
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_legacy_id", (q) => q.eq("id", row.id))
        .unique();
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("profiles", data);
    }
    return { imported: args.rows.length };
  },
});

export const importChildren = mutation({
  args: { rows: v.array(childRow) },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      const data = {
        id: row.id,
        profileId: row.profile_id,
        age: row.age ?? undefined,
        gender: row.gender ?? undefined,
        createdAt: toMs(row.created_at),
      };
      const existing = await ctx.db
        .query("children")
        .withIndex("by_legacy_id", (q) => q.eq("id", row.id))
        .unique();
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("children", data);
    }
    return { imported: args.rows.length };
  },
});

export const importItems = mutation({
  args: { rows: v.array(itemRow) },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      const data = {
        id: row.id,
        sellerId: row.seller_id,
        title: row.title,
        description: row.description,
        pricingType: row.pricing_type,
        pricingDetail: row.pricing_detail ?? undefined,
        category: row.category,
        size: row.size ?? undefined,
        shoeSize: row.shoe_size ?? undefined,
        imageUrl: row.image_url,
        status: row.status,
        createdAt: toMs(row.created_at),
        updatedAt: toMs(row.updated_at),
      };
      const existing = await ctx.db
        .query("items")
        .withIndex("by_legacy_id", (q) => q.eq("id", row.id))
        .unique();
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("items", data);
    }
    return { imported: args.rows.length };
  },
});

export const importReservations = mutation({
  args: { rows: v.array(reservationRow) },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      const data = {
        id: row.id,
        itemId: row.item_id,
        buyerId: row.buyer_id,
        status: row.status,
        createdAt: toMs(row.created_at),
        expiresAt: toMs(row.expires_at),
      };
      const existing = await ctx.db
        .query("reservations")
        .withIndex("by_legacy_id", (q) => q.eq("id", row.id))
        .unique();
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("reservations", data);
    }
    return { imported: args.rows.length };
  },
});

export const importConversations = mutation({
  args: { rows: v.array(conversationRow) },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      const data = {
        id: row.id,
        itemId: row.item_id,
        buyerId: row.buyer_id,
        sellerId: row.seller_id,
        createdAt: toMs(row.created_at),
        updatedAt: toMs(row.updated_at),
      };
      const existing = await ctx.db
        .query("conversations")
        .withIndex("by_legacy_id", (q) => q.eq("id", row.id))
        .unique();
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("conversations", data);
    }
    return { imported: args.rows.length };
  },
});

export const importMessages = mutation({
  args: { rows: v.array(messageRow) },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      const data = {
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        content: row.content,
        readAt: row.read_at ? toMs(row.read_at) : undefined,
        createdAt: toMs(row.created_at),
      };
      const existing = await ctx.db
        .query("messages")
        .withIndex("by_legacy_id", (q) => q.eq("id", row.id))
        .unique();
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("messages", data);
    }
    return { imported: args.rows.length };
  },
});

export const counts = query({
  args: {},
  handler: async (ctx) => {
    const [profiles, children, items, reservations, conversations, messages] = await Promise.all([
      ctx.db.query("profiles").collect(),
      ctx.db.query("children").collect(),
      ctx.db.query("items").collect(),
      ctx.db.query("reservations").collect(),
      ctx.db.query("conversations").collect(),
      ctx.db.query("messages").collect(),
    ]);
    return {
      profiles: profiles.length,
      children: children.length,
      items: items.length,
      reservations: reservations.length,
      conversations: conversations.length,
      messages: messages.length,
    };
  },
});

export const listLegacyAssets = query({
  args: {},
  handler: async (ctx) => {
    const [items, profiles] = await Promise.all([
      ctx.db.query("items").collect(),
      ctx.db.query("profiles").collect(),
    ]);
    return {
      items: items
        .filter((item) => !item.imageUrl.startsWith("http"))
        .map((item) => ({ id: item.id, imageUrl: item.imageUrl })),
      profiles: profiles
        .filter((profile) => !!profile.avatarUrl && !profile.avatarUrl.startsWith("http"))
        .map((profile) => ({ id: profile.id, avatarUrl: profile.avatarUrl! })),
    };
  },
});

export const setItemAsset = mutation({
  args: {
    id: v.string(),
    imageUrl: v.string(),
    imageStorageId: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("items")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.id))
      .unique();
    if (!item) return { ok: false };
    await ctx.db.patch(item._id, {
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const setProfileAvatarAsset = mutation({
  args: {
    id: v.string(),
    avatarUrl: v.string(),
    avatarStorageId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_legacy_id", (q) => q.eq("id", args.id))
      .unique();
    if (!profile) return { ok: false };
    await ctx.db.patch(profile._id, {
      avatarUrl: args.avatarUrl,
      avatarStorageId: args.avatarStorageId,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});
