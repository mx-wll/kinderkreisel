"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ClaimAccountForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    repeatPassword: "",
    name: "",
    surname: "",
    residency: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    if (formData.password !== formData.repeatPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          surname: formData.surname,
          residency: formData.residency,
          phone: formData.phone,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Konto-Übernahme fehlgeschlagen.");
      }
      router.push("/");
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Bestehendes Konto übernehmen</CardTitle>
          <CardDescription>
            Einmalig für Bestandskonten aus der alten Version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Vorname</Label>
                <Input id="name" required value={formData.name} onChange={(e) => updateField("name", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="surname">Nachname</Label>
                <Input id="surname" required value={formData.surname} onChange={(e) => updateField("surname", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="residency">Ortsteil</Label>
              <Input id="residency" required value={formData.residency} onChange={(e) => updateField("residency", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input id="phone" required value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Neue Login-E-Mail</Label>
              <Input id="email" type="email" required value={formData.email} onChange={(e) => updateField("email", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Neues Passwort</Label>
              <Input id="password" type="password" required value={formData.password} onChange={(e) => updateField("password", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="repeatPassword">Passwort wiederholen</Label>
              <Input id="repeatPassword" type="password" required value={formData.repeatPassword} onChange={(e) => updateField("repeatPassword", e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Wird übernommen..." : "Konto übernehmen"}
            </Button>
            <p className="text-center text-sm">
              <Link href="/login" className="underline underline-offset-4">
                Zurück zum Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
