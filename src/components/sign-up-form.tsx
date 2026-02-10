"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    repeatPassword: "",
    name: "",
    surname: "",
    residency: "",
    phone: "",
  });
  const [phoneConsent, setPhoneConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.repeatPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      setIsLoading(false);
      return;
    }

    if (!privacyConsent) {
      setError("Bitte stimme der Datenschutzerklärung zu.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/login?verified=1")}`,
          data: {
            name: formData.name,
            surname: formData.surname,
            residency: formData.residency,
            zip_code: "83623",
            phone: formData.phone,
            phone_consent: phoneConsent,
          },
        },
      });
      if (error) throw error;
      router.push("/signup-success");
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("already registered")) {
          setError(
            "Diese E-Mail-Adresse ist bereits registriert. Versuch dich einzuloggen!"
          );
        } else {
          setError(error.message);
        }
      } else {
        setError("Ein unbekannter Fehler ist aufgetreten.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Konto erstellen</CardTitle>
          <CardDescription>
            Willkommen bei findln! Registrier dich und leg los.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Vorname</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Max"
                    required
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="surname">Nachname</Label>
                  <Input
                    id="surname"
                    type="text"
                    placeholder="Mustermann"
                    required
                    value={formData.surname}
                    onChange={(e) => updateField("surname", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="max@beispiel.de"
                  required
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="residency">Ortsteil</Label>
                  <Input
                    id="residency"
                    type="text"
                    placeholder="z.B. Hauroth"
                    required
                    value={formData.residency}
                    onChange={(e) => updateField("residency", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zip_code">PLZ</Label>
                  <Input
                    id="zip_code"
                    type="text"
                    value="83623"
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+49 171 1234567"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Passwort wiederholen</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={formData.repeatPassword}
                  onChange={(e) =>
                    updateField("repeatPassword", e.target.value)
                  }
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="phone-consent"
                  checked={phoneConsent}
                  onCheckedChange={(checked) =>
                    setPhoneConsent(checked === true)
                  }
                />
                <Label
                  htmlFor="phone-consent"
                  className="text-sm leading-snug font-normal"
                >
                  Meine Telefonnummer darf bei einer Reservierung an
                  Interessenten weitergegeben werden.
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacy-consent"
                  checked={privacyConsent}
                  onCheckedChange={(checked) =>
                    setPrivacyConsent(checked === true)
                  }
                  required
                />
                <Label
                  htmlFor="privacy-consent"
                  className="text-sm leading-snug font-normal"
                >
                  Ich stimme der{" "}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-4"
                    target="_blank"
                  >
                    Datenschutzerklärung
                  </Link>{" "}
                  zu.
                </Label>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Wird erstellt..." : "Registrieren"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Schon registriert?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Einloggen
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
