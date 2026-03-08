import { hash } from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex/server";
import { AUTH_COOKIE_NAME, getSessionCookieOptions, signSession } from "@/lib/auth/session";
import { ResendSendError, sendResendEmail } from "@/lib/email/resend";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email: string;
    password: string;
    name: string;
    surname?: string;
  };

  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }
  if (body.password.length < 8) {
    return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
  }

  try {
    const resendConfigured = Boolean(process.env.RESEND_API_KEY);
    const resendFromConfigured = Boolean(process.env.RESEND_FROM_EMAIL?.trim());
    if (process.env.NODE_ENV === "production" && (!resendConfigured || !resendFromConfigured)) {
      return NextResponse.json(
        { error: "E-Mail-Versand ist aktuell nicht konfiguriert. Bitte kontaktiere den Support." },
        { status: 503 }
      );
    }

    const passwordHash = await hash(body.password, 12);
    const created = await convexMutation<{ profileId: string; email: string; needsOnboarding: boolean }>("auth:createUser", {
      email: body.email,
      passwordHash,
      name: body.name,
      surname: body.surname,
    });

    if (!resendConfigured) {
      await convexMutation("auth:markEmailVerified", {
        profileId: created.profileId,
      });
      const token = await signSession({
        profileId: created.profileId,
        email: created.email,
        needsOnboarding: created.needsOnboarding,
      });
      const response = NextResponse.json({ success: true, autoVerified: true, redirectTo: "/onboarding" });
      response.cookies.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions());
      return response;
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await convexMutation("auth:createEmailVerificationToken", {
      profileId: created.profileId,
      tokenHash,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    });
    const origin = new URL(request.url).origin;
    const link = `${origin}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
    await sendResendEmail({
      to: created.email,
      subject: "Bitte bestätige deine E-Mail",
      html: `<p>Bitte bestätige deine E-Mail:</p><p><a href="${link}">${link}</a></p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("EMAIL_EXISTS")) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits registriert." },
        { status: 409 }
      );
    }
    if (
      error instanceof ResendSendError &&
      ["RESEND_NOT_CONFIGURED", "RESEND_FROM_EMAIL_MISSING", "RESEND_FROM_EMAIL_INVALID"].includes(
        error.message
      )
    ) {
      return NextResponse.json(
        { error: "Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut." },
        { status: 503 }
      );
    }
    if (error instanceof ResendSendError && error.message.startsWith("RESEND_SEND_FAILED:")) {
      console.error("[auth/signup] resend send failed", {
        status: error.status,
        detail: error.detail,
      });
      return NextResponse.json(
        { error: "Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut." },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: "Registrierung fehlgeschlagen." }, { status: 500 });
  }
}
