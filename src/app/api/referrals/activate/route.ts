import { NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    trigger?: string;
  };

  try {
    const result = await convexMutation<{ activated: boolean; reason?: string; trigger?: string }>(
      "referrals:markActivated",
      {
        profileId: session.profileId,
        trigger: body.trigger?.trim() || "unknown",
      }
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Activation failed" }, { status: 500 });
  }
}
