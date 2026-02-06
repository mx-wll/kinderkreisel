import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Fast geschafft! 🎉</CardTitle>
        <CardDescription>Schau in dein E-Mail-Postfach</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Wir haben dir eine E-Mail geschickt. Klick auf den Link darin, um
          dein Konto zu bestätigen — dann kann&apos;s losgehen!
        </p>
        <p className="text-center text-sm">
          <Link href="/login" className="underline underline-offset-4">
            Zurück zum Login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
