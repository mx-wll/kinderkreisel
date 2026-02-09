import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatView } from "@/components/chat-view";
import type { Conversation, Message } from "@/lib/types/database";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch conversation with item and both profiles
  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      `
      *,
      item:items!item_id (
        id,
        title,
        image_url
      ),
      buyer:profiles!buyer_id (
        id,
        name,
        avatar_url
      ),
      seller:profiles!seller_id (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("id", id)
    .single();

  if (!conversation) notFound();

  const typedConversation = conversation as unknown as Conversation & {
    item: { id: string; title: string; image_url: string };
    buyer: { id: string; name: string; avatar_url: string | null };
    seller: { id: string; name: string; avatar_url: string | null };
  };

  // Verify current user is a participant
  const isBuyer = user.id === typedConversation.buyer_id;
  const isSeller = user.id === typedConversation.seller_id;
  if (!isBuyer && !isSeller) redirect("/messages");

  const otherUser = isBuyer
    ? typedConversation.seller
    : typedConversation.buyer;

  // Fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return (
    <ChatView
      conversationId={id}
      currentUserId={user.id}
      initialMessages={(messages as Message[]) || []}
      item={typedConversation.item}
      otherUser={otherUser}
    />
  );
}
