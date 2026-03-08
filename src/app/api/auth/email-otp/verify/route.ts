import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex/server";
import { AUTH_COOKIE_NAME, getSessionCookieOptions, signSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    code?: string;
  };
  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();
  if (!email || !code) {
    return NextResponse.json({ error: "E-Mail und Code sind erforderlich." }, { status: 400 });
  }

  const codeHash = createHash("sha256").update(code).digest("hex");

  try {
    const result = await convexMutation<{
      profileId: string;
      email: string;
      needsOnboarding: boolean;
      createdAccount: boolean;
    }>("auth:consumeEmailLoginCode", {
      email,
      codeHash,
    });

    const token = await signSession({
      profileId: result.profileId,
      email: result.email,
      needsOnboarding: result.needsOnboarding,
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: result.needsOnboarding ? "/onboarding" : "/",
      createdAccount: result.createdAccount,
    });
    response.cookies.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof Error && ["INVALID_CODE", "CODE_USED", "CODE_EXPIRED"].includes(error.message)) {
      return NextResponse.json({ error: "Der Code ist ungültig oder abgelaufen." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "SIGNUP_NAME_REQUIRED") {
      return NextResponse.json({ error: "Für neue Konten brauchen wir deinen Namen." }, { status: 400 });
    }
    return NextResponse.json({ error: "Anmeldung mit Code fehlgeschlagen." }, { status: 500 });
  }
}
