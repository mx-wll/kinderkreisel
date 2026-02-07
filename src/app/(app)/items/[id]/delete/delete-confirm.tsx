"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DeleteItemConfirm({
  itemId,
  imageUrl,
}: {
  itemId: string;
  imageUrl: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const supabase = createClient();

      // Delete item (DB cascade removes reservations)
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);

      if (error) {
        toast.error("Löschen fehlgeschlagen. Bitte versuche es erneut.");
        return;
      }

      // Clean up storage
      await supabase.storage.from("items").remove([imageUrl]);

      toast.success("Artikel gelöscht.");
      router.push("/profile");
    });
  }

  return (
    <div className="flex gap-3">
      <Button asChild variant="outline" className="flex-1">
        <Link href={`/items/${itemId}`}>Abbrechen</Link>
      </Button>
      <Button
        variant="destructive"
        className="flex-1"
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? "Wird gelöscht…" : "Endgültig löschen"}
      </Button>
    </div>
  );
}
