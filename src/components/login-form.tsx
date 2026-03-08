"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginMode = "otp" | "password";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [mode, setMode] = useState<LoginMode>("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      toast.success("E-Mail bestätigt! Du kannst dich jetzt einloggen.");
    }
    const oauthError = searchParams.get("error");
    if (oauthError === "google_failed" || oauthError === "google_state" || oauthError === "google_denied") {
      const reason = searchParams.get("reason");
      toast.error(
        reason
          ? `Google-Anmeldung ist fehlgeschlagen: ${reason}`
          : "Google-Anmeldung ist fehlgeschlagen. Bitte versuche es erneut."
      );
    }
    if (oauthError === "google_config") {
      const reason = searchParams.get("reason");
      toast.error(
        reason
          ? `Google-Anmeldung ist nicht konfiguriert: ${reason}`
          : "Google-Anmeldung ist noch nicht vollständig konfiguriert."
      );
    }
  }, [searchParams]);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        const message = body.error || "Login fehlgeschlagen.";
        setShowResendVerification(response.status === 403);
        throw new Error(message);
      }
      setShowResendVerification(false);
      router.push("/");
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendCode() {
    if (!email.trim()) {
      setError("Bitte gib zuerst deine E-Mail-Adresse ein.");
      return;
    }
    setIsSendingCode(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/email-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
        body: JSON.stringify({ email, code }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; redirectTo?: string };
      if (!response.ok) {
        throw new Error(body.error || "Anmeldung mit Code fehlgeschlagen.");
      }
      router.push(body.redirectTo || "/");
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!email) {
      setError("Bitte gib zuerst deine E-Mail-Adresse ein.");
      return;
    }
    setIsResendingVerification(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Bestätigungs-E-Mail konnte nicht gesendet werden.");
      }
      toast.success("Bestätigungs-E-Mail wurde erneut gesendet.");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setIsResendingVerification(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Einloggen</CardTitle>
          <CardDescription>
            Standard ist jetzt der E-Mail-Code. Passwort bleibt als Fallback.
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
                <Label htmlFor="otp-email">E-Mail</Label>
                <Input
                  id="otp-email"
                  type="email"
                  placeholder="max@beispiel.de"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="button" variant="outline" className="w-full" onClick={handleSendCode} disabled={isSendingCode}>
                {isSendingCode ? "Code wird gesendet..." : codeSent ? "Code erneut senden" : "Code senden"}
              </Button>
              {codeSent && (
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Wird geprüft..." : "Mit Code einloggen"}
                </Button>
              )}
              <Button type="button" variant="outline" className="w-full" asChild>
                <a href="/api/auth/google/start">Mit Google fortfahren</a>
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="max@beispiel.de"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Link href="/reset-password" className="inline-block w-fit text-sm underline-offset-4 hover:underline">
                  Passwort vergessen?
                </Link>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {showResendVerification && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                >
                  {isResendingVerification ? "Wird gesendet..." : "Bestätigungs-E-Mail erneut senden"}
                </Button>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Wird eingeloggt..." : "Mit Passwort einloggen"}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            Noch kein Konto? <Link href="/signup" className="underline underline-offset-4">Registrieren</Link>
          </div>
          <div className="mt-2 text-center text-sm">
            Bestehendes Konto? <Link href="/claim-account" className="underline underline-offset-4">Jetzt übernehmen</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
