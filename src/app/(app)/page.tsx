import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/item-card";
import { RefreshButton } from "@/components/refresh-button";
import type { ItemWithSeller } from "@/lib/types/database";

export default async function HomePage() {
  const supabase = await createClient();

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
    .eq("status", "available")
    .order("created_at", { ascending: false });

  const feed = (items ?? []) as unknown as ItemWithSeller[];

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kinderkreisel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Secondhand Kinderartikel in deiner Nachbarschaft.
          </p>
        </div>
        <RefreshButton />
      </div>

      {feed.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground">
            Noch keine Artikel vorhanden.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {feed.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
