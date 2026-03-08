import { NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex/server";
import { AUTH_COOKIE_NAME, getSessionCookieOptions, signSession } from "@/lib/auth/session";
import {
  consumeGoogleOAuthCookies,
  exchangeGoogleCode,
  verifyGoogleIdToken,
} from "@/lib/auth/google";

function redirectTo(path: string, baseUrl: string) {
  return NextResponse.redirect(new URL(path, baseUrl));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return redirectTo(`/login?error=google_denied`, origin);
  }

  const { state, verifier, nonce } = await consumeGoogleOAuthCookies();
  if (!code || !returnedState || !state || !verifier || !nonce || returnedState !== state) {
    return redirectTo("/login?error=google_state", origin);
  }

  try {
    const tokens = await exchangeGoogleCode(code, verifier, origin);
    const profile = await verifyGoogleIdToken(tokens.id_token, nonce);
    const result = await convexMutation<{
      profileId: string;
      email: string;
      isNewUser: boolean;
      needsOnboarding: boolean;
    }>(
      "auth:upsertOAuthUser",
      {
        provider: "google",
        providerUserId: profile.sub,
        email: profile.email,
        emailVerified: profile.emailVerified,
        name: profile.givenName || profile.fullName,
        surname: profile.familyName,
      }
    );

    const token = await signSession({
      profileId: result.profileId,
      email: result.email,
      needsOnboarding: result.needsOnboarding,
    });

    const response = redirectTo(result.needsOnboarding ? "/onboarding" : "/", origin);
    response.cookies.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    console.error("[auth/google/callback] failed", error);
    return redirectTo("/login?error=google_failed", origin);
  }
}
