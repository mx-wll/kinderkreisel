import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getStorageUrl } from "@/lib/utils";
import type { ProfileWithItemCount } from "@/lib/types/database";

export function ProfileCard({ profile }: { profile: ProfileWithItemCount }) {
  const avatarUrl = profile.avatar_url
    ? getStorageUrl("avatars", profile.avatar_url)
    : null;

  const initials = profile.name
    ? profile.name.charAt(0).toUpperCase()
    : "?";

  return (
    <Link
      href={`/profiles/${profile.id}`}
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
    >
      <Avatar className="h-12 w-12">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={profile.name} />}
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {profile.name} {profile.surname}
        </p>
        <p className="text-sm text-muted-foreground">{profile.residency}</p>
      </div>
      <Badge variant="secondary">
        {profile.item_count} {profile.item_count === 1 ? "Artikel" : "Artikel"}
      </Badge>
    </Link>
  );
}
