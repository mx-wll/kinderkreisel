import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Ups, da lief was schief 😬</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {params?.error ? (
          <p className="text-sm text-muted-foreground">{params.error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ein unbekannter Fehler ist aufgetreten. Versuch es bitte nochmal.
          </p>
        )}
        <p className="text-center text-sm">
          <Link href="/login" className="underline underline-offset-4">
            Zurück zum Login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
