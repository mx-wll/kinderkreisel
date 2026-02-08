"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { CLOTHING_SIZES } from "@/lib/types/database";

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
    if (category === "clothes" && !size) {
      toast.error("Bitte wähle eine Größe für Kleidung aus.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Du bist nicht angemeldet.");
        router.push("/login");
        return;
      }

      try {
        if (mode === "create") {
          // Check 20-item limit
          const { count } = await supabase
            .from("items")
            .select("*", { count: "exact", head: true })
            .eq("seller_id", user.id);

          if (count !== null && count >= 20) {
            toast.error(
              "Du hast das Maximum von 20 Artikeln erreicht. Lösche zuerst einen bestehenden Artikel."
            );
            return;
          }

          // Generate item ID for storage path
          const itemId = crypto.randomUUID();
          const ext = imageFile!.name.split(".").pop() || "jpg";
          const storagePath = `${user.id}/${itemId}.${ext}`;

          // Upload image
          const { error: uploadError } = await supabase.storage
            .from("items")
            .upload(storagePath, imageFile!);

          if (uploadError) {
            toast.error("Bild-Upload fehlgeschlagen. Bitte versuche es erneut.");
            return;
          }

          // Insert item
          const { error: insertError } = await supabase.from("items").insert({
            id: itemId,
            seller_id: user.id,
            title: title.trim(),
            description: description.trim(),
            pricing_type: pricingType,
            pricing_detail: pricingType === "other" ? pricingDetail.trim() || null : null,
            category,
            size: category === "clothes" ? size : null,
            image_url: storagePath,
            status: "available",
          });

          if (insertError) {
            // Clean up uploaded image
            await supabase.storage.from("items").remove([storagePath]);
            toast.error("Artikel konnte nicht erstellt werden. Bitte versuche es erneut.");
            return;
          }

          toast.success("Artikel erfolgreich eingestellt!");
          router.push(`/items/${itemId}`);
        } else if (mode === "edit" && initialData) {
          let storagePath = initialData.image_url;

          // Upload new image if changed
          if (imageFile) {
            const ext = imageFile.name.split(".").pop() || "jpg";
            storagePath = `${user.id}/${initialData.id}.${ext}`;

            // Remove old image first
            await supabase.storage
              .from("items")
              .remove([initialData.image_url]);

            const { error: uploadError } = await supabase.storage
              .from("items")
              .upload(storagePath, imageFile, { upsert: true });

            if (uploadError) {
              toast.error("Bild-Upload fehlgeschlagen. Bitte versuche es erneut.");
              return;
            }
          }

          const { error: updateError } = await supabase
            .from("items")
            .update({
              title: title.trim(),
              description: description.trim(),
              pricing_type: pricingType,
              pricing_detail: pricingType === "other" ? pricingDetail.trim() || null : null,
              category,
              size: category === "clothes" ? size : null,
              image_url: storagePath,
            })
            .eq("id", initialData.id);

          if (updateError) {
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
            if (next !== "clothes") setSize("");
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clothes">Kleidung</SelectItem>
            <SelectItem value="other">Sonstiges</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {category === "clothes" && (
        <div className="space-y-2">
          <Label>Größe</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger>
              <SelectValue placeholder="Größe wählen…" />
            </SelectTrigger>
            <SelectContent>
              {CLOTHING_SIZES.map((s) => (
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
