import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "@/components/profile-card";
import type { ProfileWithItemCount } from "@/lib/types/database";

export default async function ProfilesPage() {
  const supabase = await createClient();

  // Fetch profiles with item count, sorted by most items
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*, items(count)")
    .order("created_at", { ascending: false });

  const typedProfiles: ProfileWithItemCount[] = (profiles ?? []).map(
    (p: Record<string, unknown>) => ({
      ...(p as ProfileWithItemCount),
      item_count:
        Array.isArray(p.items) && p.items.length > 0
          ? (p.items[0] as { count: number }).count
          : 0,
    })
  );

  // Sort by item count descending
  typedProfiles.sort((a, b) => b.item_count - a.item_count);

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Nachbarn</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Schau, wer noch dabei ist.
      </p>

      {typedProfiles.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground">
            Noch keine Nutzer registriert.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {typedProfiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
