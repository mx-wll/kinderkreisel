import { NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export async function DELETE() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await convexMutation("profiles:remove", { id: session.profileId });
    await convexMutation("auth:deleteAuthUserByProfileId", {
      profileId: session.profileId,
    });
  } catch {
    return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
