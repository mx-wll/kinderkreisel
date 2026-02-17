"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
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
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const convexMessages = useQuery(
    api.chat.getMessages,
    { conversationId }
  );
  const sendConvexMessage = useMutation(api.chat.sendMessage);
  const markConversationRead = useMutation(api.chat.markConversationRead);
  const messages: Message[] = useMemo(() => {
    if (!convexMessages) return initialMessages;
    return convexMessages.map((msg) => ({
      id: msg.id,
      conversation_id: msg.conversationId,
      sender_id: msg.senderId,
      content: msg.content,
      read_at: msg.readAt ? new Date(msg.readAt).toISOString() : null,
      created_at: new Date(msg.createdAt).toISOString(),
    }));
  }, [convexMessages, initialMessages]);

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
    const hasUnread = messages.some((m) => m.sender_id !== currentUserId && !m.read_at);
    if (!hasUnread) return;
    markConversationRead({ conversationId, userId: currentUserId }).catch(() => {});
  }, [messages, currentUserId, markConversationRead, conversationId]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");

    try {
      await sendConvexMessage({
        conversationId,
        senderId: currentUserId,
        content,
      });
    } catch {
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-3 py-2">
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
      </div>
    </div>
  );
}
