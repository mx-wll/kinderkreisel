import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStorageUrl } from "@/lib/utils";
import Image from "next/image";
import { DeleteItemConfirm } from "./delete-confirm";

export default async function DeleteItemPage({
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
  if (item.seller_id !== user?.id) redirect(`/items/${id}`);

  const imageUrl = getStorageUrl("items", item.image_url);

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Artikel löschen</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Bist du sicher, dass du diesen Artikel löschen möchtest? Das kann nicht
        rückgängig gemacht werden.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
        <div className="p-3">
          <p className="font-medium">{item.title}</p>
        </div>
      </div>

      <div className="mt-6">
        <DeleteItemConfirm
          itemId={id}
          imageUrl={item.image_url}
        />
      </div>
    </div>
  );
}
