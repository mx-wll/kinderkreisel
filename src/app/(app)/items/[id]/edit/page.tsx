import { notFound, redirect } from "next/navigation";
import { getStorageUrl } from "@/lib/utils";
import { ItemForm } from "@/components/item-form";
import type { PricingType, Category } from "@/lib/types/database";
import { convexQuery } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) return null;

  const item = await convexQuery<{
    id: string;
    sellerId: string;
    title: string;
    description: string;
    pricingType: PricingType;
    pricingDetail?: string;
    category: Category;
    size?: string;
    shoeSize?: string;
    imageUrl: string;
  } | null>("items:getById", { id });

  if (!item) notFound();

  // Only the seller can edit
  if (item.sellerId !== session.profileId) redirect(`/items/${id}`);

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
            pricing_type: item.pricingType as PricingType,
            pricing_detail: item.pricingDetail ?? null,
            category: (item.category as Category) ?? "other",
            size: item.size ?? null,
            shoe_size: item.shoeSize ?? null,
            image_url: item.imageUrl,
          }}
          existingImageUrl={getStorageUrl("items", item.imageUrl)}
        />
      </div>
    </div>
  );
}
