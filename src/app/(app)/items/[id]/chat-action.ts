"use server";

import { redirect } from "next/navigation";
import { convexMutation } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";

export async function startChat(itemId: string, sellerId: string) {
  const session = await getCurrentSession();
  if (!session) return { error: "Nicht angemeldet." };

  if (session.profileId === sellerId) {
    return { error: "Du kannst dir nicht selbst schreiben." };
  }

  try {
    const result = await convexMutation<{ id: string }>("chat:startConversation", {
      itemId,
      buyerId: session.profileId,
      sellerId,
    });
    redirect(`/messages/${result.id}`);
  } catch {
    return { error: "Chat konnte nicht erstellt werden. Bitte versuche es erneut." };
  }
}
