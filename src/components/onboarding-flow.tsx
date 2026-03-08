"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OnboardingStep = 1 | 2 | 3;

export function OnboardingFlow({
  initialZipCode,
  initialPhone,
  initialAddressLine1,
  initialAddressLine2,
}: {
  initialZipCode?: string;
  initialPhone?: string;
  initialAddressLine1?: string;
  initialAddressLine2?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [zipCode, setZipCode] = useState(initialZipCode ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [addressLine1, setAddressLine1] = useState(initialAddressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(initialAddressLine2 ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function save(payload: Record<string, string>) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/account/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Speichern fehlgeschlagen.");
      }
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Speichern fehlgeschlagen.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!zipCode.trim()) {
      setError("Bitte gib deine PLZ ein.");
      return;
    }
    const ok = await save({ zipCode: zipCode.trim() });
    if (ok) setStep(2);
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await save({ phone: phone.trim() });
    if (ok) setStep(3);
  }

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await save({ addressLine1: addressLine1.trim(), addressLine2: addressLine2.trim() });
    if (ok) {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Willkommen bei findln</CardTitle>
        <CardDescription>
          Schritt {step} von 3. Deine PLZ ist Pflicht, Telefonnummer und Adresse kannst du optional ergänzen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <form onSubmit={handleZipSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">PLZ</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                inputMode="numeric"
                placeholder="83623"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Wird gespeichert..." : "Weiter"}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Zurück
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Wird gespeichert..." : "Weiter"}
              </Button>
            </div>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(3)}>
              Überspringen
            </Button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleAddressSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Adresse</Label>
              <Input
                id="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Straße und Hausnummer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Adresszusatz</Label>
              <Input
                id="addressLine2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Optional"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Zurück
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Wird gespeichert..." : "Fertig"}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                router.push("/");
                router.refresh();
              }}
            >
              Jetzt überspringen
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
