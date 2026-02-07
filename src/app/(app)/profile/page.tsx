import Link from "next/link";
import { PlusCircle, Clock, Phone, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "@/components/logout-button";
import { AvatarUpload } from "@/components/avatar-upload";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { CancelReservationButton } from "@/app/(app)/items/[id]/cancel-reservation-button";
import {
  getStorageUrl,
  timeAgo,
  pricingLabel,
  timeRemaining,
  whatsappUrl,
} from "@/lib/utils";
import { ProfileEditToggle } from "./profile-edit-toggle";
import type {
  Profile,
  Item,
  Reservation,
} from "@/lib/types/database";

type ItemWithReservation = Item & {
  reservations: Reservation[];
};

export default async function MyProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  // Fetch own items with their active reservations
  const { data: items } = await supabase
    .from("items")
    .select(
      `
      *,
      reservations (
        id,
        buyer_id,
        status,
        created_at,
        expires_at
      )
    `
    )
    .eq("seller_id", user!.id)
    .order("created_at", { ascending: false });

  // Fetch reservations where user is buyer
  const { data: myReservations } = await supabase
    .from("reservations")
    .select(
      `
      *,
      item:items (
        id,
        title,
        image_url,
        seller:profiles!seller_id (
          id,
          name,
          phone,
          avatar_url
        )
      )
    `
    )
    .eq("buyer_id", user!.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const typedProfile = profile as Profile | null;
  const typedItems = (items ?? []) as unknown as ItemWithReservation[];
  const typedReservations = myReservations as unknown as Array<
    Reservation & {
      item: Item & {
        seller: { id: string; name: string; phone: string; avatar_url: string | null };
      };
    }
  > ?? [];

  // Items that others have reserved
  const itemsWithActiveReservations = typedItems.filter(
    (item) =>
      item.reservations?.some((r) => r.status === "active")
  );

  if (!typedProfile) {
    return (
      <div className="px-4 py-6">
        <p className="text-muted-foreground">Profil wird geladen…</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mein Profil</h1>
        <LogoutButton />
      </div>

      {/* Avatar */}
      <AvatarUpload
        userId={typedProfile.id}
        currentAvatarUrl={typedProfile.avatar_url}
        name={typedProfile.name}
      />

      {/* Profile info + edit */}
      <ProfileEditToggle profile={typedProfile} />

      <Separator />

      {/* My Items */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Meine Artikel</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/items/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Einstellen
            </Link>
          </Button>
        </div>

        {typedItems.length === 0 ? (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Du hast noch keine Artikel. Jetzt etwas einstellen!
            </p>
            <Button asChild className="mt-3" size="sm">
              <Link href="/items/new">Ersten Artikel einstellen</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {typedItems.map((item) => {
              const imageUrl = getStorageUrl("items", item.image_url);
              return (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-lg border p-3"
                >
                  <Link
                    href={`/items/${item.id}`}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md"
                  >
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <Link href={`/items/${item.id}`}>
                      <p className="truncate text-sm font-medium">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pricingLabel(item.pricing_type, item.pricing_detail)} · {timeAgo(item.created_at)}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2">
                      {item.status === "reserved" && (
                        <Badge variant="destructive" className="text-[10px]">
                          Reserviert
                        </Badge>
                      )}
                      <div className="ml-auto flex gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                          <Link href={`/items/${item.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Link href={`/items/${item.id}/delete`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Separator />

      {/* Incoming reservations (items others reserved from me) */}
      {itemsWithActiveReservations.length > 0 && (
        <>
          <section>
            <h2 className="text-lg font-semibold">Eingehende Reservierungen</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Andere Nutzer haben diese Artikel von dir reserviert.
            </p>
            <div className="mt-3 space-y-3">
              {itemsWithActiveReservations.map((item) => {
                const activeRes = item.reservations.find(
                  (r) => r.status === "active"
                )!;
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <Link
                      href={`/items/${item.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {timeRemaining(activeRes.expires_at)}
                    </div>
                    <CancelReservationButton
                      reservationId={activeRes.id}
                      itemId={item.id}
                    />
                  </div>
                );
              })}
            </div>
          </section>
          <Separator />
        </>
      )}

      {/* My Reservations (as buyer) */}
      <section>
        <h2 className="text-lg font-semibold">Meine Reservierungen</h2>

        {typedReservations.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Keine aktiven Reservierungen.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {typedReservations.map((res) => {
              const itemImageUrl = getStorageUrl("items", res.item.image_url);
              const sellerAvatarUrl = res.item.seller.avatar_url
                ? getStorageUrl("avatars", res.item.seller.avatar_url)
                : null;
              return (
                <div
                  key={res.id}
                  className="rounded-lg border p-3 space-y-3"
                >
                  <div className="flex gap-3">
                    <Link
                      href={`/items/${res.item.id}`}
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md"
                    >
                      <img
                        src={itemImageUrl}
                        alt={res.item.title}
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/items/${res.item.id}`}>
                        <p className="truncate text-sm font-medium">
                          {res.item.title}
                        </p>
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          {sellerAvatarUrl && (
                            <AvatarImage
                              src={sellerAvatarUrl}
                              alt={res.item.seller.name}
                            />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {res.item.seller.name?.charAt(0).toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {res.item.seller.name}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeRemaining(res.expires_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href={`tel:${res.item.seller.phone}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Anrufen
                      </a>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <a
                        href={whatsappUrl(res.item.seller.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Separator />

      {/* Danger zone */}
      <section>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
