import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ItemNotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Artikel nicht gefunden</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Der Artikel existiert nicht oder wurde gelöscht.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Zurück zur Startseite</Link>
      </Button>
    </div>
  );
}
