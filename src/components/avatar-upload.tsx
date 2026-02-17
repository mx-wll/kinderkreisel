"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Camera, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { convexClientMutation } from "@/lib/convex/client";
import { uploadFileToConvex } from "@/lib/storage/client";

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
        const uploaded = await uploadFileToConvex(compressed as File);
        const result = await convexClientMutation<{ oldAvatarStorageId?: string }>("profiles:update", {
          id: userId,
          avatarUrl: uploaded.url,
          avatarStorageId: uploaded.storageId,
        });
        if (result.oldAvatarStorageId && result.oldAvatarStorageId !== uploaded.storageId) {
          await convexClientMutation("files:deleteFile", { storageId: result.oldAvatarStorageId });
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
      try {
        const result = await convexClientMutation<{ oldAvatarStorageId?: string }>("profiles:update", {
          id: userId,
          avatarUrl: null,
          avatarStorageId: null,
        });
        if (result.oldAvatarStorageId) {
          await convexClientMutation("files:deleteFile", { storageId: result.oldAvatarStorageId });
        }
      } catch {
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
          <AvatarImage src={currentAvatarUrl} alt={name} />
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
