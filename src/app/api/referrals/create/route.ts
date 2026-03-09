import { NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex/server";
import { getCurrentSession } from "@/lib/auth/server";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    channel?: string;
  };

  try {
    const result = await convexMutation<{ inviteId: string }>("referrals:createInvite", {
      inviterProfileId: session.profileId,
      channel: body.channel,
    });

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      inviteId: result.inviteId,
      shareUrl: `${origin}/invite/${encodeURIComponent(result.inviteId)}`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "Du hast heute schon viele Einladungen erstellt. Versuch es spaeter nochmal." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Einladung konnte nicht erstellt werden." }, { status: 500 });
  }
}
