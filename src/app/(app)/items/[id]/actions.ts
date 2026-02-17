"use server";

import { revalidatePath } from "next/cache";
import { convexMutation } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";

export async function reserveItem(itemId: string) {
  const session = await getCurrentSession();
  if (!session) return { error: "Nicht angemeldet." };
  try {
    await convexMutation("items:reserve", {
      id: itemId,
      buyerId: session.profileId,
    });
    revalidatePath(`/items/${itemId}`);
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Reservierung fehlgeschlagen. Bitte versuche es erneut." };
  }
}

export async function cancelReservation(
  reservationId: string,
  itemId: string
) {
  const session = await getCurrentSession();
  if (!session) return { error: "Nicht angemeldet." };
  try {
    await convexMutation("items:cancelReservation", {
      id: itemId,
      actorId: session.profileId,
      reservationId,
    });
    revalidatePath(`/items/${itemId}`);
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Stornierung fehlgeschlagen. Bitte versuche es erneut." };
  }
}
