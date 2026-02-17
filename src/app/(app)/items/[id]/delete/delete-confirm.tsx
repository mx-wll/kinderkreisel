"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { convexClientMutation } from "@/lib/convex/client";

export function DeleteItemConfirm({
  itemId,
}: {
  itemId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const me = (await fetch("/api/auth/me").then((r) => r.json())) as { user: { id: string } | null };
      if (!me.user) {
        toast.error("Du bist nicht angemeldet.");
        return;
      }

      try {
        await convexClientMutation("items:remove", { id: itemId, actorId: me.user.id });
      } catch {
        toast.error("Löschen fehlgeschlagen. Bitte versuche es erneut.");
        return;
      }

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
