"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await fetch("/api/account", { method: "DELETE" });

      if (!res.ok) {
        toast.error("Account konnte nicht gelöscht werden. Bitte versuche es erneut.");
        return;
      }

      toast.success("Account gelöscht. Auf Wiedersehen!");
      router.push("/login");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Account löschen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account wirklich löschen?</DialogTitle>
          <DialogDescription>
            Dein gesamtes Profil, alle Artikel und Reservierungen werden
            unwiderruflich gelöscht. Das kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Wird gelöscht…" : "Endgültig löschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
