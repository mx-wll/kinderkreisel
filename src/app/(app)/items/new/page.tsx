import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/item-form";

export default async function NewItemPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check item count for 20-item limit
  const { count } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", user!.id);

  const atLimit = count !== null && count >= 20;

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Artikel einstellen</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Was möchtest du weitergeben?
      </p>

      {atLimit ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <p className="font-medium">Maximum erreicht</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Du hast bereits 20 Artikel eingestellt. Lösche zuerst einen
            bestehenden Artikel, um Platz zu schaffen.
          </p>
          <Button asChild className="mt-4">
            <Link href="/profile">Meine Artikel verwalten</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <ItemForm mode="create" />
        </div>
      )}
    </div>
  );
}
