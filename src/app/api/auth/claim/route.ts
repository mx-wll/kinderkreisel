import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex/server";
import { AUTH_COOKIE_NAME, signSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const enabled = process.env.ENABLE_ACCOUNT_CLAIM === "true";
  if (!enabled) {
    return NextResponse.json({ error: "Konto-Übernahme ist deaktiviert." }, { status: 403 });
  }

  const body = (await request.json()) as {
    email: string;
    password: string;
    name: string;
    surname: string;
    residency: string;
    phone: string;
  };

  if (!body.email || !body.password || !body.name || !body.surname || !body.residency || !body.phone) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }
  if (body.password.length < 8) {
    return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
  }

  try {
    const passwordHash = await hash(body.password, 12);
    const claimed = await convexMutation<{ profileId: string; email: string }>("auth:claimLegacyProfile", {
      email: body.email,
      passwordHash,
      name: body.name,
      surname: body.surname,
      residency: body.residency,
      phone: body.phone,
    });

    const token = await signSession({
      profileId: claimed.profileId,
      email: claimed.email,
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
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("EMAIL_EXISTS")) {
        return NextResponse.json({ error: "E-Mail ist bereits registriert." }, { status: 409 });
      }
      if (error.message.includes("ALREADY_CLAIMED")) {
        return NextResponse.json({ error: "Dieses Konto wurde bereits übernommen." }, { status: 409 });
      }
      if (error.message.includes("CLAIM_NOT_FOUND")) {
        return NextResponse.json(
          { error: "Kein passendes bestehendes Konto gefunden. Bitte prüfe deine Angaben." },
          { status: 404 }
        );
      }
    }
    return NextResponse.json({ error: "Konto-Übernahme fehlgeschlagen." }, { status: 500 });
  }
}
