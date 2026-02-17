import { notFound, redirect } from "next/navigation";
import { ChatView } from "@/components/chat-view";
import type { Message } from "@/lib/types/database";
import { convexQuery } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const conversation = await convexQuery<{
    id: string;
    itemId: string;
    buyerId: string;
    sellerId: string;
  } | null>("chat:getConversationById", { id });
  if (!conversation) notFound();

  const isBuyer = session.profileId === conversation.buyerId;
  const isSeller = session.profileId === conversation.sellerId;
  if (!isBuyer && !isSeller) redirect("/messages");

  const [item, buyer, seller, messages] = await Promise.all([
    convexQuery<{ id: string; title: string; imageUrl: string } | null>("items:getById", { id: conversation.itemId }),
    convexQuery<{ id: string; name: string; avatarUrl?: string } | null>("profiles:getById", { id: conversation.buyerId }),
    convexQuery<{ id: string; name: string; avatarUrl?: string } | null>("profiles:getById", { id: conversation.sellerId }),
    convexQuery<
      Array<{
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        readAt?: number;
        createdAt: number;
      }>
    >("chat:getMessages", { conversationId: id }),
  ]);
  if (!item || !buyer || !seller) notFound();

  const otherUser = isBuyer
    ? { id: seller.id, name: seller.name, avatar_url: seller.avatarUrl ?? null }
    : { id: buyer.id, name: buyer.name, avatar_url: buyer.avatarUrl ?? null };

  const typedMessages: Message[] = messages.map((msg) => ({
    id: msg.id,
    conversation_id: msg.conversationId,
    sender_id: msg.senderId,
    content: msg.content,
    read_at: msg.readAt ? new Date(msg.readAt).toISOString() : null,
    created_at: new Date(msg.createdAt).toISOString(),
  }));

  return (
    <ChatView
      conversationId={id}
      currentUserId={session.profileId}
      initialMessages={typedMessages}
      item={{ id: item.id, title: item.title, image_url: item.imageUrl }}
      otherUser={otherUser}
    />
  );
}
