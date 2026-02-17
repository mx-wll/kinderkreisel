import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: session.profileId,
      email: session.email,
    },
  });
}
