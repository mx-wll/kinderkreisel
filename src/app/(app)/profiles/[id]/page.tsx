import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ItemCard } from "@/components/item-card";
import { getStorageUrl } from "@/lib/utils";
import type { Profile, ItemWithSeller } from "@/lib/types/database";
import { convexQuery } from "@/lib/convex/server";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profileData = await convexQuery<{
    id: string;
    name: string;
    surname: string;
    residency: string;
    zipCode: string;
    phone: string;
    avatarUrl?: string;
    phoneConsent: boolean;
    emailNotifications: boolean;
    lastMessageEmailAt: number;
    createdAt: number;
    updatedAt: number;
  } | null>("profiles:getById", { id });

  if (!profileData) notFound();

  const typedProfile: Profile = {
    id: profileData.id,
    name: profileData.name,
    surname: profileData.surname,
    residency: profileData.residency,
    zip_code: profileData.zipCode,
    phone: profileData.phone,
    avatar_url: profileData.avatarUrl ?? null,
    phone_consent: profileData.phoneConsent,
    email_notifications: profileData.emailNotifications,
    last_message_email_at: new Date(profileData.lastMessageEmailAt).toISOString(),
    created_at: new Date(profileData.createdAt).toISOString(),
    updated_at: new Date(profileData.updatedAt).toISOString(),
  };

  const sellerItems = await convexQuery<
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
  >("items:listBySeller", { sellerId: id, status: "available" });

  const typedItems: ItemWithSeller[] = sellerItems.map((item) => ({
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
      id: typedProfile.id,
      name: typedProfile.name,
      avatar_url: typedProfile.avatar_url,
    },
  }));

  const avatarUrl = typedProfile.avatar_url ? getStorageUrl("avatars", typedProfile.avatar_url) : null;
  const initials = typedProfile.name ? typedProfile.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="px-4 py-6">
      <Link href="/profiles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={typedProfile.name} />}
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">
            {typedProfile.name} {typedProfile.surname}
          </h1>
          <p className="text-sm text-muted-foreground">{typedProfile.residency}</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Artikel von {typedProfile.name}</h2>
      {typedItems.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{typedProfile.name} hat noch keine Artikel eingestellt.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {typedItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
