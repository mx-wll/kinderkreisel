import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ItemCard } from "@/components/item-card";
import { getStorageUrl } from "@/lib/utils";
import type { Profile, ItemWithSeller } from "@/lib/types/database";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const typedProfile = profile as Profile;

  const { data: items } = await supabase
    .from("items")
    .select(
      `
      *,
      seller:profiles!seller_id (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("seller_id", id)
    .eq("status", "available")
    .order("created_at", { ascending: false });

  const typedItems = (items ?? []) as unknown as ItemWithSeller[];

  const avatarUrl = typedProfile.avatar_url
    ? getStorageUrl("avatars", typedProfile.avatar_url)
    : null;
  const initials = typedProfile.name
    ? typedProfile.name.charAt(0).toUpperCase()
    : "?";

  return (
    <div className="px-4 py-6">
      {/* Back button */}
      <Link
        href="/profiles"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </Link>

      {/* Profile header */}
      <div className="mt-4 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {avatarUrl && (
            <AvatarImage src={avatarUrl} alt={typedProfile.name} />
          )}
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">
            {typedProfile.name} {typedProfile.surname}
          </h1>
          <p className="text-sm text-muted-foreground">
            {typedProfile.residency}
          </p>
        </div>
      </div>

      {/* Items */}
      <h2 className="mt-8 text-lg font-semibold">
        Artikel von {typedProfile.name}
      </h2>

      {typedItems.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {typedProfile.name} hat noch keine Artikel eingestellt.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {typedItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
