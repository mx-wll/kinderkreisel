"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cancelReservation } from "./actions";

export function CancelReservationButton({
  reservationId,
  itemId,
}: {
  reservationId: string;
  itemId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelReservation(reservationId, itemId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Reservierung storniert.");
      }
    });
  }

  return (
    <Button
      variant="outline"
      onClick={handleCancel}
      disabled={isPending}
      className="w-full"
    >
      {isPending ? "Wird storniert…" : "Reservierung stornieren"}
    </Button>
  );
}
