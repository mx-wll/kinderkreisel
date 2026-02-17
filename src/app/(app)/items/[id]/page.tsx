import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Phone, MessageCircle, ArrowLeft, Pencil, Trash2, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getStorageUrl,
  timeAgo,
  pricingLabel,
  timeRemaining,
  whatsappUrl,
} from "@/lib/utils";
import type { ItemWithSellerDetail } from "@/lib/types/database";
import type { Reservation } from "@/lib/types/database";
import { ReserveButton } from "./reserve-button";
import { CancelReservationButton } from "./cancel-reservation-button";
import { StartChatButton } from "@/components/start-chat-button";
import { convexQuery } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentSession();
  {
    const item = await convexQuery<{
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
    } | null>("items:getById", { id });

    if (!item) notFound();

    const seller = await convexQuery<{
      id: string;
      name: string;
      avatarUrl?: string;
      phone: string;
    } | null>("profiles:getById", { id: item.sellerId });
    if (!seller) notFound();

    const reservation = await convexQuery<{
      id: string;
      itemId: string;
      buyerId: string;
      status: "active" | "expired" | "cancelled";
      createdAt: number;
      expiresAt: number;
    } | null>("reservations:getActiveByItem", { itemId: id });

    const typedItem: ItemWithSellerDetail = {
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
        id: seller.id,
        name: seller.name,
        avatar_url: seller.avatarUrl ?? null,
        phone: seller.phone,
      },
    };

    const typedReservation: Reservation | null = reservation
      ? {
          id: reservation.id,
          item_id: reservation.itemId,
          buyer_id: reservation.buyerId,
          status: reservation.status,
          created_at: new Date(reservation.createdAt).toISOString(),
          expires_at: new Date(reservation.expiresAt).toISOString(),
        }
      : null;

    const isOwner = session?.profileId === typedItem.seller_id;
    const isReservedByMe =
      typedReservation && typedReservation.buyer_id === session?.profileId;
    const isReservedByOther =
      typedReservation && typedReservation.buyer_id !== session?.profileId;

    const imageUrl = getStorageUrl("items", typedItem.image_url);
    const avatarUrl = typedItem.seller.avatar_url
      ? getStorageUrl("avatars", typedItem.seller.avatar_url)
      : null;
    const initials = typedItem.seller.name
      ? typedItem.seller.name.charAt(0).toUpperCase()
      : "?";

    return (
      <div className="pb-6">
        <div className="px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </div>
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={typedItem.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <Badge
            variant={typedItem.pricing_type === "free" ? "default" : "secondary"}
            className="absolute bottom-3 left-3"
          >
            {pricingLabel(typedItem.pricing_type, typedItem.pricing_detail)}
          </Badge>
          {typedItem.status === "reserved" && (
            <Badge variant="destructive" className="absolute bottom-3 right-3">
              Reserviert
            </Badge>
          )}
        </div>
        <div className="px-4">
          <div className="mt-4">
            <h1 className="text-xl font-bold leading-tight">{typedItem.title}</h1>
            {(typedItem.category !== "other" || typedItem.size || typedItem.shoe_size) && (
              <p className="mt-1 text-sm text-muted-foreground">
                {typedItem.category === "clothing" ? "Kleidung" :
                 typedItem.category === "shoes" ? "Schuhe" :
                 typedItem.category === "toys" ? "Spielzeug" :
                 typedItem.category === "outdoor_sports" ? "Draußen & Sport" : "Sonstiges"}
                {typedItem.size && ` · Größe ${typedItem.size}`}
                {typedItem.shoe_size && ` · Größe ${typedItem.shoe_size}`}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">{timeAgo(typedItem.created_at)}</p>
          </div>
          <Separator className="my-4" />
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{typedItem.description}</p>
          <Separator className="my-4" />
          <Link
            href={`/profiles/${typedItem.seller.id}`}
            className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-accent/50"
          >
            <Avatar className="h-10 w-10">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={typedItem.seller.name} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{typedItem.seller.name}</p>
              <p className="text-xs text-muted-foreground">Profil ansehen</p>
            </div>
          </Link>
          <Separator className="my-4" />
          <div className="space-y-3">
            {isOwner && (
              <>
                <div className="flex gap-3">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/items/${id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Bearbeiten
                    </Link>
                  </Button>
                  <Button asChild variant="destructive" className="flex-1">
                    <Link href={`/items/${id}/delete`}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
                    </Link>
                  </Button>
                </div>
                {typedReservation && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm font-medium">Dieser Artikel ist reserviert</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {timeRemaining(typedReservation.expires_at)}
                    </div>
                    <CancelReservationButton reservationId={typedReservation.id} itemId={id} />
                  </div>
                )}
              </>
            )}
            {!isOwner && typedItem.status === "available" && <ReserveButton itemId={id} />}
            {!isOwner && isReservedByMe && typedReservation && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium">Du hast diesen Artikel reserviert!</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {timeRemaining(typedReservation.expires_at)}
                </div>
                <Separator className="my-3" />
                <p className="text-sm text-muted-foreground">
                  Kontaktiere den Verkäufer, um die Abholung zu vereinbaren:
                </p>
                <div className="mt-3 flex gap-3">
                  <Button asChild variant="outline" className="flex-1">
                    <a href={`tel:${typedItem.seller.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Anrufen
                    </a>
                  </Button>
                  <Button asChild className="flex-1">
                    <a href={whatsappUrl(typedItem.seller.phone)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                </div>
                <CancelReservationButton reservationId={typedReservation.id} itemId={id} />
              </div>
            )}
            {!isOwner && isReservedByOther && (
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <Badge variant="destructive">Reserviert</Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  Dieser Artikel ist gerade reserviert. Schau später nochmal vorbei!
                </p>
              </div>
            )}
            {!isOwner && session && <StartChatButton itemId={id} sellerId={typedItem.seller_id} />}
          </div>
        </div>
      </div>
    );
  }
}
