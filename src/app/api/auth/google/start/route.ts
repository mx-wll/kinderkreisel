import { NextResponse } from "next/server";
import { createGoogleAuthorizationUrl } from "@/lib/auth/google";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  try {
    const url = await createGoogleAuthorizationUrl(origin);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[auth/google/start] failed to create authorization url", error);
    const reason = error instanceof Error ? error.message : "Google configuration is missing";
    return NextResponse.redirect(
      new URL(`/login?error=google_config&reason=${encodeURIComponent(reason)}`, origin)
    );
  }
}
