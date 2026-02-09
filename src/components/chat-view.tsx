"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getStorageUrl, timeAgo } from "@/lib/utils";
import type { Message } from "@/lib/types/database";

type ChatItem = {
  id: string;
  title: string;
  image_url: string;
};

type ChatUser = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export function ChatView({
  conversationId,
  currentUserId,
  initialMessages,
  item,
  otherUser,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  item: ChatItem;
  otherUser: ChatUser;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Auto-scroll to bottom
  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    const unreadIds = messages
      .filter((m) => m.sender_id !== currentUserId && !m.read_at)
      .map((m) => m.id);

    if (unreadIds.length === 0) return;

    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds)
      .then(() => {
        setMessages((prev) =>
          prev.map((m) =>
            unreadIds.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m
          )
        );
      });
  }, [messages, currentUserId, supabase]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates (optimistic update already added it)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");

    // Optimistic message
    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
    });

    if (error) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInput(content);
    }

    setSending(false);
    inputRef.current?.focus();
  }

  const itemImageUrl = getStorageUrl("items", item.image_url);
  const otherAvatarUrl = otherUser.avatar_url
    ? getStorageUrl("avatars", otherUser.avatar_url)
    : null;
  const otherInitial = otherUser.name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-background px-3 py-2">
        <Link
          href="/messages"
          className="flex-shrink-0 rounded-full p-1 hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link
          href={`/items/${item.id}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={itemImageUrl}
              alt={item.title}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.title}</p>
            <div className="flex items-center gap-1.5">
              <Avatar className="h-4 w-4">
                {otherAvatarUrl && (
                  <AvatarImage src={otherAvatarUrl} alt={otherUser.name} />
                )}
                <AvatarFallback className="text-[8px]">
                  {otherInitial}
                </AvatarFallback>
              </Avatar>
              <p className="truncate text-xs text-muted-foreground">
                {otherUser.name}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Schreib die erste Nachricht!
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col",
                  isMine ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    isMine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">
                  {timeAgo(msg.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t bg-background px-3 py-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mx-auto flex max-w-lg items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Nachricht schreiben…"
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none rounded-xl border bg-muted/50 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || sending}
            className="h-10 w-10 flex-shrink-0 rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
