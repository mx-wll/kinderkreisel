import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getStorageUrl, timeAgo } from "@/lib/utils";
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
    <Link href={`/items/${item.id}`} className="group block">
      <Card className="flex-row gap-0 overflow-hidden rounded-[4px] py-0 transition-colors hover:bg-accent/50 sm:flex-col">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden sm:h-auto sm:w-full sm:aspect-square">
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 639px) 128px, (max-width: 1024px) 33vw, 25vw"
          />
        </div>

        <CardContent className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-3">
          <div className="min-w-0">
            <h3 className="truncate font-medium leading-tight">
              {item.title}
              {(item.size || item.shoe_size) && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  · Gr. {item.size || item.shoe_size}
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="h-5 w-5">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={item.seller.name} />}
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="truncate">{item.seller.name}</span>
            <span className="ml-auto shrink-0">{timeAgo(item.created_at)}</span>
          </div>

          {item.category !== "other" && (
            <div>
              <Badge variant="outline" className="bg-background/80">
                {CATEGORIES.find((c) => c.slug === item.category)?.label}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
