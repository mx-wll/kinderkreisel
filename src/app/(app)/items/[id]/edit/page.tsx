import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStorageUrl } from "@/lib/utils";
import { ItemForm } from "@/components/item-form";
import type { PricingType, Category } from "@/lib/types/database";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (!item) notFound();

  // Only the seller can edit
  if (item.seller_id !== user?.id) redirect(`/items/${id}`);

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Artikel bearbeiten</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Änderungen werden sofort übernommen.
      </p>

      <div className="mt-6">
        <ItemForm
          mode="edit"
          initialData={{
            id: item.id,
            title: item.title,
            description: item.description,
            pricing_type: item.pricing_type as PricingType,
            pricing_detail: item.pricing_detail,
            category: (item.category as Category) ?? "other",
            size: item.size ?? null,
            image_url: item.image_url,
          }}
          existingImageUrl={getStorageUrl("items", item.image_url)}
        />
      </div>
    </div>
  );
}
