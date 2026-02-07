"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Camera, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 400,
  useWebWorker: true,
};

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  name,
}: {
  userId: string;
  currentAvatarUrl: string | null;
  name: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const initials = name ? name.charAt(0).toUpperCase() : "?";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Bitte wähle ein Bild aus.");
      return;
    }

    startTransition(async () => {
      try {
        const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/avatar.${ext}`;
        const supabase = createClient();

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, compressed, { upsert: true });

        if (uploadError) {
          toast.error("Upload fehlgeschlagen. Bitte versuche es erneut.");
          return;
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: path })
          .eq("id", userId);

        if (updateError) {
          toast.error("Profil konnte nicht aktualisiert werden.");
          return;
        }

        toast.success("Profilbild aktualisiert!");
        router.refresh();
      } catch {
        toast.error("Bild konnte nicht verarbeitet werden.");
      }
    });

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    startTransition(async () => {
      const supabase = createClient();

      if (currentAvatarUrl) {
        await supabase.storage.from("avatars").remove([currentAvatarUrl]);
      }

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (error) {
        toast.error("Profilbild konnte nicht entfernt werden.");
        return;
      }

      toast.success("Profilbild entfernt.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      <Avatar className="h-20 w-20">
        {currentAvatarUrl && (
          <AvatarImage
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${currentAvatarUrl}`}
            alt={name}
          />
        )}
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          <Camera className="mr-2 h-4 w-4" />
          {isPending ? "Lädt…" : currentAvatarUrl ? "Foto ändern" : "Foto hochladen"}
        </Button>
        {currentAvatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Entfernen
          </Button>
        )}
      </div>
    </div>
  );
}
