import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { convexMutation, convexQuery } from "@/lib/convex/server";
import { ResendSendError, sendResendEmail } from "@/lib/email/resend";

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
    await sendResendEmail({
      to: authUser.email,
      subject: "Bitte bestätige deine E-Mail",
      html: `<p>Bitte bestätige deine E-Mail:</p><p><a href="${link}">${link}</a></p>`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ResendSendError && error.message.startsWith("RESEND_SEND_FAILED:")) {
      console.error("[auth/resend-verification] resend send failed", {
        status: error.status,
        detail: error.detail,
      });
    }
    if (
      error instanceof ResendSendError &&
      ["RESEND_NOT_CONFIGURED", "RESEND_FROM_EMAIL_MISSING", "RESEND_FROM_EMAIL_INVALID"].includes(
        error.message
      )
    ) {
      return NextResponse.json(
        { error: "E-Mail-Versand ist aktuell nicht korrekt konfiguriert." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Bestätigungs-E-Mail konnte nicht gesendet werden." },
      { status: 502 }
    );
  }
}
