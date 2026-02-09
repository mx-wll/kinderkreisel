"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UnreadBadge() {
  const [count, setCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Fetch initial unread count
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (!conversations || conversations.length === 0) {
        setCount(0);
        return;
      }

      const convIds = conversations.map((c) => c.id);

      const { count: unread } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .neq("sender_id", user.id)
        .is("read_at", null);

      setCount(unread || 0);
    }

    init();
  }, []);

  // Real-time subscription (only after we know the userId)
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as { sender_id: string };
          if (newMsg.sender_id !== userId) {
            setCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updated = payload.new as {
            read_at: string | null;
            sender_id: string;
          };
          const old = payload.old as { read_at: string | null };
          if (updated.read_at && !old.read_at && updated.sender_id !== userId) {
            setCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (count === 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
