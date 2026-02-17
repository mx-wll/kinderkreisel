import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { convexMutation, convexQuery } from "@/lib/convex/server";

async function sendResetMail(to: string, link: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from: "findln <onboarding@resend.dev>",
      to,
      subject: "Passwort zurücksetzen",
      html: `<p>Setze dein Passwort zurück:</p><p><a href="${link}">${link}</a></p>`,
    }),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email: string };
  if (!body.email) return NextResponse.json({ success: true });

  const authUser = await convexQuery<{
    profileId: string;
    email: string;
  } | null>("auth:getAuthUserByEmail", { email: body.email.toLowerCase() });

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
    await sendResetMail(authUser.email, link);
  }

  return NextResponse.json({ success: true });
}
