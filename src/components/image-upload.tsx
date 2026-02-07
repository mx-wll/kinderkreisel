"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 800,
  useWebWorker: true,
};

export function ImageUpload({
  value,
  onChange,
  existingUrl,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Bitte wähle ein Bild aus.");
      return;
    }

    setIsCompressing(true);
    try {
      const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
      const previewUrl = URL.createObjectURL(compressed);
      setPreview(previewUrl);
      onChange(compressed as File);
    } catch {
      toast.error("Bild konnte nicht verarbeitet werden. Versuch ein anderes.");
    } finally {
      setIsCompressing(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayUrl = preview || existingUrl;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {displayUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
          <Image
            src={displayUrl}
            alt="Vorschau"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isCompressing}
          className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted"
        >
          <Camera className="h-8 w-8" />
          <span className="text-sm">
            {isCompressing ? "Wird verarbeitet…" : "Foto hinzufügen"}
          </span>
        </button>
      )}

      {displayUrl && !isCompressing && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => inputRef.current?.click()}
        >
          Foto ändern
        </Button>
      )}
    </div>
  );
}
