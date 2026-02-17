import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    id: v.string(), // legacy Supabase profile UUID (same as auth user id)
    name: v.string(),
    surname: v.string(),
    residency: v.string(),
    zipCode: v.string(),
    phone: v.string(),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.string()),
    phoneConsent: v.boolean(),
    emailNotifications: v.boolean(),
    lastMessageEmailAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_legacy_id", ["id"])
    .index("by_createdAt", ["createdAt"]),

  children: defineTable({
    id: v.string(),
    profileId: v.string(),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_legacy_id", ["id"])
    .index("by_profileId", ["profileId"]),

  items: defineTable({
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
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_legacy_id", ["id"])
    .index("by_sellerId", ["sellerId"])
    .index("by_status_createdAt", ["status", "createdAt"])
    .index("by_category", ["category"]),

  reservations: defineTable({
    id: v.string(),
    itemId: v.string(),
    buyerId: v.string(),
    status: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_legacy_id", ["id"])
    .index("by_itemId_status", ["itemId", "status"])
    .index("by_buyerId", ["buyerId"])
    .index("by_status_expiresAt", ["status", "expiresAt"]),

  conversations: defineTable({
    id: v.string(),
    itemId: v.string(),
    buyerId: v.string(),
    sellerId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_legacy_id", ["id"])
    .index("by_itemId_buyerId", ["itemId", "buyerId"])
    .index("by_buyerId_updatedAt", ["buyerId", "updatedAt"])
    .index("by_sellerId_updatedAt", ["sellerId", "updatedAt"]),

  messages: defineTable({
    id: v.string(),
    conversationId: v.string(),
    senderId: v.string(),
    content: v.string(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_legacy_id", ["id"])
    .index("by_conversationId_createdAt", ["conversationId", "createdAt"])
    .index("by_conversationId_readAt", ["conversationId", "readAt"]),

  authUsers: defineTable({
    id: v.string(),
    profileId: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    emailVerified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_auth_id", ["id"])
    .index("by_profileId", ["profileId"])
    .index("by_email", ["email"]),

  passwordResets: defineTable({
    tokenHash: v.string(),
    profileId: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_profileId", ["profileId"]),

  emailVerifications: defineTable({
    tokenHash: v.string(),
    profileId: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_profileId", ["profileId"]),
});
