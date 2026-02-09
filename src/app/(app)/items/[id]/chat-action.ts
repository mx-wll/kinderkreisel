"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function startChat(itemId: string, sellerId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  if (user.id === sellerId) {
    return { error: "Du kannst dir nicht selbst schreiben." };
  }

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("item_id", itemId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/messages/${existing.id}`);
  }

  // Create new conversation
  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      item_id: itemId,
      buyer_id: user.id,
      seller_id: sellerId,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Chat konnte nicht erstellt werden. Bitte versuche es erneut." };
  }

  redirect(`/messages/${conversation.id}`);
}
