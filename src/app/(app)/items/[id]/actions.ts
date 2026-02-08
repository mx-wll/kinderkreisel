"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function reserveItem(itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  // Insert reservation (RLS + unique partial index enforce constraints)
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { error: resError } = await supabase.from("reservations").insert({
    item_id: itemId,
    buyer_id: user.id,
    status: "active",
    expires_at: expiresAt,
  });

  if (resError) {
    if (resError.code === "23505") {
      return { error: "Dieser Artikel ist bereits reserviert." };
    }
    return { error: "Reservierung fehlgeschlagen. Bitte versuche es erneut." };
  }

  // Update item status
  const { error: updateError } = await supabase
    .from("items")
    .update({ status: "reserved" })
    .eq("id", itemId);

  if (updateError) {
    return { error: "Reservierung fehlgeschlagen. Bitte versuche es erneut." };
  }

  revalidatePath(`/items/${itemId}`);
  revalidatePath("/");
  return { success: true };
}

export async function cancelReservation(
  reservationId: string,
  itemId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  // Cancel reservation (RLS allows seller or buyer to update)
  const { error: cancelError } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId);

  if (cancelError) {
    return { error: "Stornierung fehlgeschlagen. Bitte versuche es erneut." };
  }

  // Reset item status
  const { error: updateError } = await supabase
    .from("items")
    .update({ status: "available" })
    .eq("id", itemId);

  if (updateError) {
    return { error: "Stornierung fehlgeschlagen. Bitte versuche es erneut." };
  }

  revalidatePath(`/items/${itemId}`);
  revalidatePath("/");
  return { success: true };
}
