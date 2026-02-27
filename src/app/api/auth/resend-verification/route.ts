import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { convexMutation, convexQuery } from "@/lib/convex/server";

function createResendSendFailedError(status: number) {
  return new Error(`RESEND_SEND_FAILED:${status}`);
}

async function sendVerificationMail(to: string, link: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_NOT_CONFIGURED");
  const from = process.env.RESEND_FROM_EMAIL || "findln <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Bitte bestätige deine E-Mail",
      html: `<p>Bitte bestätige deine E-Mail:</p><p><a href="${link}">${link}</a></p>`,
    }),
  });
  if (!res.ok) {
    await res.text();
    throw createResendSendFailedError(res.status);
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "E-Mail fehlt." }, { status: 400 });

  const authUser = await convexQuery<{
    profileId: string;
    email: string;
    emailVerified: boolean;
  } | null>("auth:getAuthUserByEmail", { email });
  if (!authUser) return NextResponse.json({ success: true });
  if (authUser.emailVerified) return NextResponse.json({ success: true });

  try {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await convexMutation("auth:createEmailVerificationToken", {
      profileId: authUser.profileId,
      tokenHash,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    });

    const origin = new URL(request.url).origin;
    const link = `${origin}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
    await sendVerificationMail(authUser.email, link);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("RESEND_SEND_FAILED")) {
      const [, status] = error.message.split(":");
      console.error("[auth/resend-verification] resend send failed", { status });
    }
    if (error instanceof Error && error.message.includes("RESEND_NOT_CONFIGURED")) {
      return NextResponse.json(
        { error: "E-Mail-Versand ist aktuell nicht konfiguriert." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Bestätigungs-E-Mail konnte nicht gesendet werden." },
      { status: 502 }
    );
  }
}
