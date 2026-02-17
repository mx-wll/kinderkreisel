import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/item-form";
import { convexQuery } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";

export default async function NewItemPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  // Check item count for 20-item limit
  const count = await convexQuery<number>("items:countBySeller", { sellerId: session.profileId });

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
