import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex/server";
import { AUTH_COOKIE_NAME, signSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json()) as { token: string; password: string };
  if (!body.token || !body.password) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }
  if (body.password.length < 8) {
    return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(body.token).digest("hex");
  const passwordHash = await hash(body.password, 12);

  try {
    const result = await convexMutation<{ profileId: string; email: string }>("auth:consumeResetToken", {
      tokenHash,
      passwordHash,
    });
    const token = await signSession({
      profileId: result.profileId,
      email: result.email,
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
  } catch {
    return NextResponse.json({ error: "Ungültiger oder abgelaufener Link." }, { status: 400 });
  }
}
