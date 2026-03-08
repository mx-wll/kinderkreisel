"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type SignUpMode = "otp" | "password";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [mode, setMode] = useState<SignUpMode>("otp");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    repeatPassword: "",
    code: "",
  });
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handlePasswordSignUp(e: React.FormEvent) {
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

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Registrierung fehlgeschlagen.");
      }
      const body = (await response.json().catch(() => ({}))) as { autoVerified?: boolean; redirectTo?: string };
      if (body.autoVerified) {
        router.push(body.redirectTo || "/onboarding");
      } else {
        router.push("/signup-success");
      }
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendCode() {
    if (!privacyConsent) {
      setError("Bitte stimme der Datenschutzerklärung zu.");
      return;
    }
    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Bitte gib Name und E-Mail ein.");
      return;
    }
    setIsSendingCode(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/email-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; devCode?: string };
      if (!response.ok) {
        throw new Error(body.error || "Der Code konnte nicht gesendet werden.");
      }
      setCodeSent(true);
      if (body.devCode) {
        toast.success(`Dev-Code: ${body.devCode}`);
      } else {
        toast.success("Wir haben dir einen Code per E-Mail geschickt.");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; redirectTo?: string };
      if (!response.ok) {
        throw new Error(body.error || "Registrierung mit Code fehlgeschlagen.");
      }
      router.push(body.redirectTo || "/onboarding");
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
          <CardTitle className="text-2xl">Konto erstellen</CardTitle>
          <CardDescription>
            Standard ist jetzt der E-Mail-Code. Passwort bleibt optional als Fallback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === "otp" ? "default" : "outline"} onClick={() => setMode("otp")}>
              E-Mail-Code
            </Button>
            <Button type="button" variant={mode === "password" ? "default" : "outline"} onClick={() => setMode("password")}>
              Passwort
            </Button>
          </div>

          {mode === "otp" ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Max Mustermann"
                  required
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
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
              {codeSent && (
                <div className="grid gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    placeholder="123456"
                    required
                    value={formData.code}
                    onChange={(e) => updateField("code", e.target.value)}
                  />
                </div>
              )}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacy-consent-otp"
                  checked={privacyConsent}
                  onCheckedChange={(checked) => setPrivacyConsent(checked === true)}
                  required
                />
                <Label htmlFor="privacy-consent-otp" className="text-sm leading-snug font-normal">
                  Ich stimme der <Link href="/privacy" className="underline underline-offset-4" target="_blank">Datenschutzerklärung</Link> zu.
                </Label>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="button" variant="outline" className="w-full" onClick={handleSendCode} disabled={isSendingCode}>
                {isSendingCode ? "Code wird gesendet..." : codeSent ? "Code erneut senden" : "Code senden"}
              </Button>
              {codeSent && (
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Wird erstellt..." : "Mit Code registrieren"}
                </Button>
              )}
              <Button type="button" variant="outline" className="w-full" asChild>
                <a href="/api/auth/google/start">Mit Google registrieren</a>
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSignUp} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="password-name">Name</Label>
                <Input
                  id="password-name"
                  type="text"
                  placeholder="Max Mustermann"
                  required
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password-email">E-Mail</Label>
                <Input
                  id="password-email"
                  type="email"
                  placeholder="max@beispiel.de"
                  required
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
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
                  onChange={(e) => updateField("repeatPassword", e.target.value)}
                />
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacy-consent-password"
                  checked={privacyConsent}
                  onCheckedChange={(checked) => setPrivacyConsent(checked === true)}
                  required
                />
                <Label htmlFor="privacy-consent-password" className="text-sm leading-snug font-normal">
                  Ich stimme der <Link href="/privacy" className="underline underline-offset-4" target="_blank">Datenschutzerklärung</Link> zu.
                </Label>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Wird erstellt..." : "Mit Passwort registrieren"}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            Schon registriert? <Link href="/login" className="underline underline-offset-4">Einloggen</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
