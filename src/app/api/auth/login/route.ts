import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { convexQuery } from "@/lib/convex/server";
import { AUTH_COOKIE_NAME, getSessionCookieOptions, signSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email: string;
    password: string;
  };
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const user = await convexQuery<{
    profileId: string;
    email: string;
    passwordHash?: string;
    emailVerified: boolean;
    needsOnboarding: boolean;
  } | null>("auth:getAuthUserByEmail", { email: body.email.toLowerCase() });

  if (!user) {
    return NextResponse.json({ error: "E-Mail oder Passwort stimmen nicht." }, { status: 401 });
  }
  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "Dieses Konto nutzt aktuell Google-Login. Bitte melde dich mit Google an." },
      { status: 401 }
    );
  }

  const ok = await compare(body.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "E-Mail oder Passwort stimmen nicht." }, { status: 401 });
  }
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Bitte bestätige zuerst deine E-Mail-Adresse. Prüfe dein Postfach." },
      { status: 403 }
    );
  }

  const token = await signSession({
    profileId: user.profileId,
    email: user.email,
    needsOnboarding: user.needsOnboarding,
  });
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}
