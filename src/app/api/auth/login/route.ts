import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { convexQuery } from "@/lib/convex/server";
import { AUTH_COOKIE_NAME, signSession } from "@/lib/auth/session";

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
    passwordHash: string;
    emailVerified: boolean;
  } | null>("auth:getAuthUserByEmail", { email: body.email.toLowerCase() });

  if (!user) {
    return NextResponse.json({ error: "E-Mail oder Passwort stimmen nicht." }, { status: 401 });
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
  });
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
