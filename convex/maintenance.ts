import { mutation } from "./_generated/server";

export const expireReservations = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const active = await ctx.db
      .query("reservations")
      .withIndex("by_status_expiresAt", (q) => q.eq("status", "active"))
      .collect();

    let expiredCount = 0;
    for (const reservation of active) {
      if (reservation.expiresAt >= now) continue;
      expiredCount += 1;
      await ctx.db.patch(reservation._id, { status: "expired" });
      const item = await ctx.db
        .query("items")
        .withIndex("by_legacy_id", (q) => q.eq("id", reservation.itemId))
        .unique();
      if (item) {
        await ctx.db.patch(item._id, {
          status: "available",
          updatedAt: now,
        });
      }
    }

    return { expiredCount };
  },
});

export const sendMessageDigest = mutation({
  args: {},
  handler: async () => {
    // Placeholder for migration phase: wire Resend action and user-level digest batching.
    return { ok: true };
  },
});
