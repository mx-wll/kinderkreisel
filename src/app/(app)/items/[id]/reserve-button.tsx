"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { reserveItem } from "./actions";

export function ReserveButton({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleReserve() {
    startTransition(async () => {
      const result = await reserveItem(itemId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Artikel reserviert! Du hast 48 Stunden Zeit.");
      }
    });
  }

  return (
    <Button
      onClick={handleReserve}
      disabled={isPending}
      className="w-full"
      size="lg"
    >
      {isPending ? "Wird reserviert…" : "Reservieren"}
    </Button>
  );
}
