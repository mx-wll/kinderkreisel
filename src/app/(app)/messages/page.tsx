import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStorageUrl, timeAgo } from "@/lib/utils";
import type { Conversation, Message } from "@/lib/types/database";

type ConversationRow = Conversation & {
  item: { id: string; title: string; image_url: string };
  buyer: { id: string; name: string; avatar_url: string | null };
  seller: { id: string; name: string; avatar_url: string | null };
};

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch conversations where user is participant
  const { data: conversations } = await supabase
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
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  const typedConversations = (conversations || []) as unknown as ConversationRow[];

  // Fetch last message + unread count for each conversation
  const conversationsWithMeta = await Promise.all(
    typedConversations.map(async (conv) => {
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("content, created_at, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastMessage = (lastMessages?.[0] as Pick<
        Message,
        "content" | "created_at" | "sender_id"
      >) || null;

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .is("read_at", null);

      const otherUser =
        user.id === conv.buyer_id ? conv.seller : conv.buyer;

      return { ...conv, lastMessage, unreadCount: count || 0, otherUser };
    })
  );

  return (
    <div className="mx-auto max-w-lg">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold">Nachrichten</h1>
      </div>

      {conversationsWithMeta.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Noch keine Nachrichten. Stöbere durch die Artikel und schreib den
            Verkäufer an!
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {conversationsWithMeta.map((conv) => {
            const itemImageUrl = getStorageUrl("items", conv.item.image_url);
            const avatarUrl = conv.otherUser.avatar_url
              ? getStorageUrl("avatars", conv.otherUser.avatar_url)
              : null;
            const initial =
              conv.otherUser.name?.charAt(0).toUpperCase() || "?";

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
              >
                {/* Item thumbnail */}
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={itemImageUrl}
                    alt={conv.item.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Avatar className="h-5 w-5 flex-shrink-0">
                        {avatarUrl && (
                          <AvatarImage
                            src={avatarUrl}
                            alt={conv.otherUser.name}
                          />
                        )}
                        <AvatarFallback className="text-[8px]">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium">
                        {conv.otherUser.name}
                      </span>
                    </div>
                    {conv.lastMessage && (
                      <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(conv.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                    {conv.item.title}
                  </p>
                  {conv.lastMessage && (
                    <p
                      className={`mt-0.5 truncate text-xs ${
                        conv.unreadCount > 0
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {conv.lastMessage.sender_id === user.id ? "Du: " : ""}
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Unread badge */}
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
