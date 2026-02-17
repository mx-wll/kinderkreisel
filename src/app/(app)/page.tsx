import Link from "next/link";
import { ItemCard } from "@/components/item-card";
import { RefreshButton } from "@/components/refresh-button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { SearchFilter } from "@/components/search-filter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Leaf, MapPinHouse, Shirt } from "lucide-react";
import type { ItemWithSeller } from "@/lib/types/database";
import { convexQuery } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";

type HomeSearchParams = {
  q?: string;
  pricing?: string;
  category?: string;
  size?: string;
  shoe_size?: string;
};

function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_theme(colors.teal.50),_theme(colors.emerald.50)_45%,_theme(colors.amber.50)_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-teal-300/35 blur-3xl" />
        <div className="absolute -right-20 top-24 h-64 w-64 rounded-full bg-emerald-300/35 blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-orange-300/35 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 pb-14 pt-8 sm:px-8 sm:pt-10">
        <header className="flex items-center justify-between">
          <p className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-borel)]">
            findln
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Einloggen</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/signup">Registrieren</Link>
            </Button>
          </div>
        </header>

        <section className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-10">
          <div>
            <Badge
              variant="outline"
              className="rounded-full border-teal-300/70 bg-teal-100/70 text-teal-900"
            >
              Lokal in 83623
            </Badge>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
              Kinderkleidung weitergeben, statt wegwerfen.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              findln ist dein Nachbarschafts-Markt für Kinderartikel: verschenken, verleihen
              oder tauschen. Schnell eingestellt, direkt in deiner Nähe.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/signup">
                  Kostenlos starten
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-6">
                <Link href="/login">Ich habe schon ein Konto</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-teal-200/60 bg-white/85 p-5 shadow-[0_30px_80px_-40px_rgba(20,184,166,0.35)] backdrop-blur-sm">
            <div className="grid gap-3">
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-sm text-muted-foreground">Gerade beliebt</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-medium">Winterjacke 110/116</p>
                  <Badge className="rounded-full bg-teal-600 text-white">Kostenlos</Badge>
                </div>
              </div>
              <div className="rounded-2xl bg-teal-50 p-4">
                <p className="text-sm text-muted-foreground">Neu eingestellt</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-medium">Schlittschuhe Größe 31</p>
                  <Badge className="rounded-full bg-emerald-500 text-emerald-950">
                    Leihen
                  </Badge>
                </div>
              </div>
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-sm text-muted-foreground">Treffpunkt</p>
                <p className="mt-2 flex items-center gap-2 font-medium">
                  <MapPinHouse className="h-4 w-4 text-orange-500" />
                  Holzkirchen & Umgebung
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-teal-200/70 bg-white/70 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Shirt className="h-4 w-4 text-teal-700" />
              Kinderkleidung
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Größen, Schuhe, Jacken, Sets und mehr.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200/70 bg-white/70 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Leaf className="h-4 w-4 text-emerald-700" />
              Nachhaltig
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Gute Sachen bleiben im Kreislauf.
            </p>
          </div>
          <div className="rounded-2xl border border-orange-200/70 bg-white/70 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <MapPinHouse className="h-4 w-4 text-orange-600" />
              Lokal
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Keine Pakete, keine Gebühren, direkte Übergabe.
            </p>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 pt-4 text-sm text-muted-foreground">
          <p>Für Familien in 83623.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Datenschutz
            </Link>
            <Link href="/impressum" className="hover:text-foreground">
              Impressum
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function HomeFeed({
  items,
  hasFilters,
}: {
  items: ItemWithSeller[];
  hasFilters: boolean;
}) {
  return (
    <PullToRefresh>
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-borel)]">findln</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Secondhand Kinderartikel in deiner Nachbarschaft.
            </p>
          </div>
          <div className="hidden sm:block">
            <RefreshButton />
          </div>
        </div>

        <SearchFilter />

        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground">
              {hasFilters
                ? "Keine Artikel gefunden. Versuch es mit einem anderen Suchbegriff."
                : "Noch keine Artikel vorhanden."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const { q, pricing, category, size, shoe_size } = await searchParams;
  const session = await getCurrentSession();

  if (!session) {
    return <LandingPage />;
  }

  const items = await convexQuery<
    Array<{
      id: string;
      sellerId: string;
      title: string;
      description: string;
      pricingType: "free" | "lending" | "other";
      pricingDetail?: string;
      category: "clothing" | "shoes" | "toys" | "outdoor_sports" | "other";
      size?: string;
      shoeSize?: string;
      imageUrl: string;
      status: "available" | "reserved";
      createdAt: number;
      updatedAt: number;
    }>
  >("items:listAvailable", {
    q: q || undefined,
    pricing: pricing || undefined,
    category: category || undefined,
    size: size || undefined,
    shoeSize: shoe_size || undefined,
    limit: 80,
  });

  const sellerIds = Array.from(new Set(items.map((item) => item.sellerId)));
  const sellers = await Promise.all(
    sellerIds.map((id) =>
      convexQuery<{ id: string; name: string; avatarUrl?: string } | null>("profiles:getById", { id })
    )
  );
  const sellerMap = new Map(
    sellers.filter((seller): seller is { id: string; name: string; avatarUrl?: string } => !!seller).map((seller) => [seller.id, seller])
  );

  const feed: ItemWithSeller[] = items.map((item) => ({
    id: item.id,
    seller_id: item.sellerId,
    title: item.title,
    description: item.description,
    pricing_type: item.pricingType,
    pricing_detail: item.pricingDetail ?? null,
    category: item.category,
    size: item.size ?? null,
    shoe_size: item.shoeSize ?? null,
    image_url: item.imageUrl,
    status: item.status,
    created_at: new Date(item.createdAt).toISOString(),
    updated_at: new Date(item.updatedAt).toISOString(),
    seller: {
      id: item.sellerId,
      name: sellerMap.get(item.sellerId)?.name ?? "Unbekannt",
      avatar_url: sellerMap.get(item.sellerId)?.avatarUrl ?? null,
    },
  }));

  const hasFilters = !!(q || pricing || category || size || shoe_size);
  return <HomeFeed items={feed} hasFilters={hasFilters} />;
}
