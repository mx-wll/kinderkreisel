"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

export function ProfileForm({
  profile,
  onDone,
}: {
  profile: Profile;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(profile.name);
  const [surname, setSurname] = useState(profile.surname);
  const [residency, setResidency] = useState(profile.residency);
  const [phone, setPhone] = useState(profile.phone);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !surname.trim()) {
      toast.error("Name und Nachname sind Pflichtfelder.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          surname: surname.trim(),
          residency: residency.trim(),
          phone: phone.trim(),
        })
        .eq("id", profile.id);

      if (error) {
        toast.error("Profil konnte nicht aktualisiert werden.");
        return;
      }

      toast.success("Profil aktualisiert!");
      router.refresh();
      onDone?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Vorname</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="surname">Nachname</Label>
        <Input
          id="surname"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="residency">Wohnort</Label>
        <Input
          id="residency"
          value={residency}
          onChange={(e) => setResidency(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefonnummer</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
        />
      </div>

      <div className="flex gap-3">
        {onDone && (
          <Button type="button" variant="outline" className="flex-1" onClick={onDone}>
            Abbrechen
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "Wird gespeichert…" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
