import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStorageUrl, timeAgo } from "@/lib/utils";
import { convexQuery } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";

export default async function MessagesPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const conversations = await convexQuery<
    Array<{
      id: string;
      itemId: string;
      buyerId: string;
      sellerId: string;
    }>
  >("chat:listConversations", { userId: session.profileId });

  const rows = (
    await Promise.all(
      conversations.map(async (conv) => {
        const [item, buyer, seller, lastMessage, unreadCount] = await Promise.all([
          convexQuery<{ id: string; title: string; imageUrl: string } | null>("items:getById", { id: conv.itemId }),
          convexQuery<{ id: string; name: string; avatarUrl?: string } | null>("profiles:getById", { id: conv.buyerId }),
          convexQuery<{ id: string; name: string; avatarUrl?: string } | null>("profiles:getById", { id: conv.sellerId }),
          convexQuery<{ content: string; createdAt: number; senderId: string } | null>("chat:getLastMessage", {
            conversationId: conv.id,
          }),
          convexQuery<number>("chat:getUnreadCount", { conversationId: conv.id, userId: session.profileId }),
        ]);
        if (!item || !buyer || !seller) return null;
        const otherUser = session.profileId === conv.buyerId ? seller : buyer;
        return {
          id: conv.id,
          item: { id: item.id, title: item.title, image_url: item.imageUrl },
          otherUser: { id: otherUser.id, name: otherUser.name, avatar_url: otherUser.avatarUrl ?? null },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                created_at: new Date(lastMessage.createdAt).toISOString(),
                sender_id: lastMessage.senderId,
              }
            : null,
          unreadCount,
        };
      })
    )
  ).filter((row): row is NonNullable<typeof row> => !!row);

  return (
    <div className="mx-auto max-w-lg">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold">Nachrichten</h1>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Noch keine Nachrichten. Stöbere durch die Artikel und schreib den Verkäufer an!
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {rows.map((conv) => {
            const itemImageUrl = getStorageUrl("items", conv.item.image_url);
            const avatarUrl = conv.otherUser.avatar_url
              ? getStorageUrl("avatars", conv.otherUser.avatar_url)
              : null;
            const initial = conv.otherUser.name?.charAt(0).toUpperCase() || "?";
            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
              >
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image src={itemImageUrl} alt={conv.item.title} fill className="object-cover" sizes="48px" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Avatar className="h-5 w-5 flex-shrink-0">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={conv.otherUser.name} />}
                        <AvatarFallback className="text-[8px]">{initial}</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium">{conv.otherUser.name}</span>
                    </div>
                    {conv.lastMessage && (
                      <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(conv.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">{conv.item.title}</p>
                  {conv.lastMessage && (
                    <p
                      className={`mt-0.5 truncate text-xs ${
                        conv.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {conv.lastMessage.sender_id === session.profileId ? "Du: " : ""}
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <div className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {conv.unreadCount}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
