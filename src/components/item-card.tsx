import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getStorageUrl, timeAgo, pricingLabel } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types/database";
import type { ItemWithSeller } from "@/lib/types/database";

export function ItemCard({ item }: { item: ItemWithSeller }) {
  const imageUrl = getStorageUrl("items", item.image_url);
  const avatarUrl = item.seller.avatar_url
    ? getStorageUrl("avatars", item.seller.avatar_url)
    : null;

  const initials = item.seller.name
    ? item.seller.name.charAt(0).toUpperCase()
    : "?";

  return (
    <Link
      href={`/items/${item.id}`}
      className="group block overflow-hidden rounded-[4px] border bg-card transition-colors hover:bg-accent/50"
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={item.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute bottom-2 left-2 flex gap-1">
          <Badge
            variant={item.pricing_type === "free" ? "default" : "secondary"}
          >
            {pricingLabel(item.pricing_type, item.pricing_detail)}
          </Badge>
          {item.category !== "other" && (
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
              {CATEGORIES.find((c) => c.slug === item.category)?.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-3">
        <h3 className="truncate font-medium leading-tight">
          {item.title}
          {(item.size || item.shoe_size) && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              · Gr. {item.size || item.shoe_size}
            </span>
          )}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <Avatar className="h-5 w-5">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={item.seller.name} />}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="truncate text-xs text-muted-foreground">
            {item.seller.name}
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {timeAgo(item.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
