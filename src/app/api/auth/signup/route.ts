import { hash } from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex/server";

async function sendVerificationMail(to: string, link: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_NOT_CONFIGURED");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from: "findln <onboarding@resend.dev>",
      to,
      subject: "Bitte bestätige deine E-Mail",
      html: `<p>Bitte bestätige deine E-Mail:</p><p><a href="${link}">${link}</a></p>`,
    }),
  });
  if (!res.ok) throw new Error("RESEND_SEND_FAILED");
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email: string;
    password: string;
    name: string;
    surname: string;
    residency: string;
    phone: string;
    phoneConsent: boolean;
  };

  if (!body.email || !body.password || !body.name || !body.surname || !body.residency || !body.phone) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }
  if (body.password.length < 8) {
    return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
  }

  try {
    const resendConfigured = Boolean(process.env.RESEND_API_KEY);
    if (process.env.NODE_ENV === "production" && !resendConfigured) {
      return NextResponse.json(
        { error: "E-Mail-Versand ist aktuell nicht konfiguriert. Bitte kontaktiere den Support." },
        { status: 503 }
      );
    }

    const passwordHash = await hash(body.password, 12);
    const created = await convexMutation<{ profileId: string; email: string }>("auth:createUser", {
      email: body.email,
      passwordHash,
      name: body.name,
      surname: body.surname,
      residency: body.residency,
      phone: body.phone,
      phoneConsent: body.phoneConsent,
    });

    if (!resendConfigured) {
      await convexMutation("auth:markEmailVerified", {
        profileId: created.profileId,
      });
      return NextResponse.json({ success: true, autoVerified: true });
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
    await sendVerificationMail(created.email, link);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("EMAIL_EXISTS")) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits registriert." },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message.includes("RESEND_NOT_CONFIGURED")) {
      return NextResponse.json(
        { error: "Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut." },
        { status: 503 }
      );
    }
    if (error instanceof Error && error.message.includes("RESEND_SEND_FAILED")) {
      return NextResponse.json(
        { error: "Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut." },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: "Registrierung fehlgeschlagen." }, { status: 500 });
  }
}
