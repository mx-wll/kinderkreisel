import { NextResponse } from "next/server";
import { convexMutation, convexQuery } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";
import { AUTH_COOKIE_NAME, getSessionCookieOptions, signSession } from "@/lib/auth/session";

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    zipCode?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
  };

  try {
    await convexMutation("profiles:update", {
      id: session.profileId,
      ...(body.zipCode !== undefined ? { zipCode: body.zipCode } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.addressLine1 !== undefined ? { addressLine1: body.addressLine1 } : {}),
      ...(body.addressLine2 !== undefined ? { addressLine2: body.addressLine2 } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("ZIP_CODE_REQUIRED")) {
      return NextResponse.json({ error: "Bitte gib deine PLZ ein." }, { status: 400 });
    }
    return NextResponse.json({ error: "Profil konnte nicht aktualisiert werden." }, { status: 500 });
  }

  const profile = await convexQuery<{ zipCode?: string } | null>("profiles:getById", {
    id: session.profileId,
  });
  const needsOnboarding = !profile?.zipCode?.trim();
  const token = await signSession({
    profileId: session.profileId,
    email: session.email,
    needsOnboarding,
  });

  const response = NextResponse.json({ success: true, needsOnboarding });
  response.cookies.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}
