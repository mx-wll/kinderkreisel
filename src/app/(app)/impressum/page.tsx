import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ImpressumPage() {
  return (
    <div className="px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Impressum</h1>

      <div className="mt-6">
        <p className="text-sm text-muted-foreground">
          Wird vor dem offiziellen Launch ergänzt.
        </p>
      </div>
    </div>
  );
}
