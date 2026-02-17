"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";
import { convexClientMutation } from "@/lib/convex/client";

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
  const [emailNotifications, setEmailNotifications] = useState(profile.email_notifications);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !surname.trim()) {
      toast.error("Name und Nachname sind Pflichtfelder.");
      return;
    }

    startTransition(async () => {
      try {
        await convexClientMutation("profiles:update", {
          id: profile.id,
          name: name.trim(),
          surname: surname.trim(),
          residency: residency.trim(),
          phone: phone.trim(),
          emailNotifications,
        });
      } catch {
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

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="email-notifications">E-Mail-Benachrichtigungen</Label>
          <p className="text-sm text-muted-foreground">
            Erhalte E-Mails bei neuen Nachrichten und Reservierungen
          </p>
        </div>
        <Switch
          id="email-notifications"
          checked={emailNotifications}
          onCheckedChange={setEmailNotifications}
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
