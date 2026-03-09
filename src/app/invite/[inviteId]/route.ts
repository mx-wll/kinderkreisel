import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { convexQuery } from "@/lib/convex/server";
import { REFERRAL_INVITE_COOKIE, getReferralCookieMaxAge } from "@/lib/referrals";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;
  const invite = await convexQuery<{ id: string } | null>("referrals:getInviteById", { id: inviteId });
  const url = new URL(request.url);
  const destination = new URL("/signup?via=invite", url.origin);

  if (!invite) {
    return NextResponse.redirect(destination);
  }

  const cookieStore = await cookies();
  cookieStore.set(REFERRAL_INVITE_COOKIE, inviteId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getReferralCookieMaxAge(),
  });

  return NextResponse.redirect(destination);
}
