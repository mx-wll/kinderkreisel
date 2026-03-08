import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { convexMutation, convexQuery } from "@/lib/convex/server";
import { ResendSendError, sendResendEmail } from "@/lib/email/resend";

export async function POST(request: Request) {
  const body = (await request.json()) as { email: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ success: true });

  const authUser = await convexQuery<{
    profileId: string;
    email: string;
  } | null>("auth:getAuthUserByEmail", { email });

  if (authUser) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await convexMutation("auth:createResetToken", {
      profileId: authUser.profileId,
      tokenHash,
      expiresAt: Date.now() + 1000 * 60 * 30,
    });
    const origin = new URL(request.url).origin;
    const link = `${origin}/auth/update-password?token=${token}`;
    try {
      await sendResendEmail({
        to: authUser.email,
        subject: "Passwort zurücksetzen",
        html: `<p>Setze dein Passwort zurück:</p><p><a href="${link}">${link}</a></p>`,
      });
    } catch (error) {
      if (error instanceof ResendSendError) {
        console.error("[auth/reset-password] resend send failed", {
          status: error.status,
          code: error.message,
          detail: error.detail,
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
