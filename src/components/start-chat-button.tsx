"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { startChat } from "@/app/(app)/items/[id]/chat-action";

export function StartChatButton({
  itemId,
  sellerId,
}: {
  itemId: string;
  sellerId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await startChat(itemId, sellerId);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant="outline"
      className="w-full"
      size="lg"
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {isPending ? "Wird geöffnet…" : "Nachricht schreiben"}
    </Button>
  );
}
