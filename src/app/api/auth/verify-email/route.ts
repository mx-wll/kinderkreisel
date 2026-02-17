import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/auth/error?error=Ungültiger%20Bestätigungslink", request.url));
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  try {
    await convexMutation("auth:consumeEmailVerificationToken", {
      tokenHash,
    });
    return NextResponse.redirect(new URL("/login?verified=1", request.url));
  } catch {
    return NextResponse.redirect(
      new URL("/auth/error?error=Ungültiger%20oder%20abgelaufener%20Bestätigungslink", request.url)
    );
  }
}
