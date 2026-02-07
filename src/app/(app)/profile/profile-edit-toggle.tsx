"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/profile-form";
import type { Profile } from "@/lib/types/database";

export function ProfileEditToggle({ profile }: { profile: Profile }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ProfileForm profile={profile} onDone={() => setIsEditing(false)} />
    );
  }

  return (
    <div>
      <div className="space-y-1">
        <p className="text-lg font-medium">
          {profile.name} {profile.surname}
        </p>
        <p className="text-sm text-muted-foreground">{profile.residency}</p>
        <p className="text-sm text-muted-foreground">{profile.phone}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="mr-2 h-4 w-4" />
        Profil bearbeiten
      </Button>
    </div>
  );
}
