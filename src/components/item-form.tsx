"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import type { PricingType, Category } from "@/lib/types/database";
import { CLOTHING_SIZES, CLOTHING_SIZE_LABELS, SHOE_SIZES, CATEGORIES } from "@/lib/types/database";
import { convexClientMutation, convexClientQuery } from "@/lib/convex/client";
import { uploadFileToConvex } from "@/lib/storage/client";

type ItemFormProps = {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    description: string;
    pricing_type: PricingType;
    pricing_detail: string | null;
    category: Category;
    size: string | null;
    shoe_size: string | null;
    image_url: string;
  };
  existingImageUrl?: string;
};

export function ItemForm({ mode, initialData, existingImageUrl }: ItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [pricingType, setPricingType] = useState<PricingType>(
    initialData?.pricing_type ?? "free"
  );
  const [pricingDetail, setPricingDetail] = useState(
    initialData?.pricing_detail ?? ""
  );
  const [category, setCategory] = useState<Category>(
    initialData?.category ?? "other"
  );
  const [size, setSize] = useState(initialData?.size ?? "");
  const [shoeSize, setShoeSize] = useState(initialData?.shoe_size ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "create" && !imageFile) {
      toast.error("Bitte füge ein Foto hinzu.");
      return;
    }
    if (!title.trim()) {
      toast.error("Bitte gib einen Titel ein.");
      return;
    }
    if (title.length > 100) {
      toast.error("Der Titel darf maximal 100 Zeichen lang sein.");
      return;
    }
    if (!description.trim()) {
      toast.error("Bitte gib eine Beschreibung ein.");
      return;
    }
    if (description.length > 1000) {
      toast.error("Die Beschreibung darf maximal 1000 Zeichen lang sein.");
      return;
    }
    if (category === "clothing" && !size) {
      toast.error("Bitte wähle eine Größe für Kleidung aus.");
      return;
    }
    if (category === "shoes" && !shoeSize) {
      toast.error("Bitte wähle eine Schuhgröße aus.");
      return;
    }

    startTransition(async () => {
      const me = (await fetch("/api/auth/me").then((r) => r.json())) as { user: { id: string } | null };
      if (!me.user) {
        toast.error("Du bist nicht angemeldet.");
        router.push("/login");
        return;
      }
      const userId = me.user.id;

      try {
        if (mode === "create") {
          // Check 20-item limit
          const count = await convexClientQuery<number>("items:countBySeller", { sellerId: userId });

          if (count !== null && count >= 20) {
            toast.error(
              "Du hast das Maximum von 20 Artikeln erreicht. Lösche zuerst einen bestehenden Artikel."
            );
            return;
          }

          // Generate item ID for storage path
          const itemId = crypto.randomUUID();
          const uploaded = await uploadFileToConvex(imageFile!);
          await convexClientMutation("items:create", {
            id: itemId,
            sellerId: userId,
            title: title.trim(),
            description: description.trim(),
            pricingType,
            pricingDetail: pricingType === "other" ? pricingDetail.trim() || undefined : undefined,
            category,
            size: category === "clothing" ? size : undefined,
            shoeSize: category === "shoes" ? shoeSize : undefined,
            imageUrl: uploaded.url,
            imageStorageId: uploaded.storageId,
          });

          toast.success("Artikel erfolgreich eingestellt!");
          router.push(`/items/${itemId}`);
        } else if (mode === "edit" && initialData) {
          let imageUrl = initialData.image_url;
          let imageStorageId: string | undefined;

          // Upload new image if changed
          if (imageFile) {
            const uploaded = await uploadFileToConvex(imageFile);
            imageUrl = uploaded.url;
            imageStorageId = uploaded.storageId;
          }

          try {
            const result = await convexClientMutation<{ oldStorageId?: string }>("items:update", {
              id: initialData.id,
              actorId: userId,
              title: title.trim(),
              description: description.trim(),
              pricingType,
              pricingDetail: pricingType === "other" ? pricingDetail.trim() || undefined : undefined,
              category,
              size: category === "clothing" ? size : undefined,
              shoeSize: category === "shoes" ? shoeSize : undefined,
              imageUrl,
              imageStorageId,
            });
            if (imageStorageId && result.oldStorageId && result.oldStorageId !== imageStorageId) {
              await convexClientMutation("files:deleteFile", { storageId: result.oldStorageId });
            }
          } catch {
            toast.error("Artikel konnte nicht aktualisiert werden. Bitte versuche es erneut.");
            return;
          }

          toast.success("Artikel aktualisiert!");
          router.push(`/items/${initialData.id}`);
        }
      } catch {
        toast.error("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Foto</Label>
        <ImageUpload
          value={imageFile}
          onChange={setImageFile}
          existingUrl={existingImageUrl}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Winterjacke Gr. 110"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          {title.length}/100 Zeichen
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibe deinen Artikel — Zustand, Größe, Besonderheiten…"
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/1000 Zeichen
        </p>
      </div>

      <div className="space-y-2">
        <Label>Kategorie</Label>
        <Select
          value={category}
          onValueChange={(val) => {
            const next = val as Category;
            setCategory(next);
            if (next !== "clothing") setSize("");
            if (next !== "shoes") setShoeSize("");
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category === "clothing" && (
        <div className="space-y-2">
          <Label>Größe</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger>
              <SelectValue placeholder="Größe wählen…" />
            </SelectTrigger>
            <SelectContent>
              {CLOTHING_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {CLOTHING_SIZE_LABELS[s] ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {category === "shoes" && (
        <div className="space-y-2">
          <Label>Schuhgröße</Label>
          <Select value={shoeSize} onValueChange={setShoeSize}>
            <SelectTrigger>
              <SelectValue placeholder="Schuhgröße wählen…" />
            </SelectTrigger>
            <SelectContent>
              {SHOE_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Wie möchtest du den Artikel abgeben?</Label>
        <Select
          value={pricingType}
          onValueChange={(val) => setPricingType(val as PricingType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Zu verschenken</SelectItem>
            <SelectItem value="lending">Zum Verleihen</SelectItem>
            <SelectItem value="other">Anderes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {pricingType === "other" && (
        <div className="space-y-2">
          <Label htmlFor="pricingDetail">Preisvorstellung</Label>
          <Input
            id="pricingDetail"
            value={pricingDetail}
            onChange={(e) => setPricingDetail(e.target.value)}
            placeholder="z.B. 5€ oder Tauschen gegen…"
          />
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending
          ? mode === "create"
            ? "Wird eingestellt…"
            : "Wird gespeichert…"
          : mode === "create"
            ? "Artikel einstellen"
            : "Änderungen speichern"}
      </Button>
    </form>
  );
}
