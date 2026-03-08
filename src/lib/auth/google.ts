import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = new URL("https://www.googleapis.com/oauth2/v3/certs");
const GOOGLE_ISSUER = "https://accounts.google.com";
const OAUTH_STATE_COOKIE = "kk_google_oauth_state";
const OAUTH_VERIFIER_COOKIE = "kk_google_oauth_verifier";
const OAUTH_NONCE_COOKIE = "kk_google_oauth_nonce";
const OAUTH_COOKIE_MAX_AGE = 60 * 10;

const jwks = createRemoteJWKSet(GOOGLE_JWKS_URL);

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token: string;
  scope: string;
  token_type: string;
};

type GoogleIdTokenClaims = JWTPayload & {
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  nonce?: string;
  sub?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getGoogleClientId() {
  return getRequiredEnv("GOOGLE_CLIENT_ID");
}

function getGoogleClientSecret() {
  return getRequiredEnv("GOOGLE_CLIENT_SECRET");
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  };
}

function encodeBase64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomUrlSafe(bytes = 32) {
  return encodeBase64Url(randomBytes(bytes));
}

function createCodeChallenge(verifier: string) {
  return encodeBase64Url(createHash("sha256").update(verifier).digest());
}

export async function createGoogleAuthorizationUrl(baseUrl: string) {
  const state = randomUrlSafe();
  const verifier = randomUrlSafe(48);
  const nonce = randomUrlSafe();
  const store = await cookies();
  const options = buildCookieOptions();

  store.set(OAUTH_STATE_COOKIE, state, options);
  store.set(OAUTH_VERIFIER_COOKIE, verifier, options);
  store.set(OAUTH_NONCE_COOKIE, nonce, options);

  const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", getGoogleClientId());
  url.searchParams.set("redirect_uri", `${baseUrl}/api/auth/google/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", createCodeChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");

  return url.toString();
}

export async function consumeGoogleOAuthCookies() {
  const store = await cookies();
  const state = store.get(OAUTH_STATE_COOKIE)?.value ?? null;
  const verifier = store.get(OAUTH_VERIFIER_COOKIE)?.value ?? null;
  const nonce = store.get(OAUTH_NONCE_COOKIE)?.value ?? null;

  store.set(OAUTH_STATE_COOKIE, "", { ...buildCookieOptions(), maxAge: 0 });
  store.set(OAUTH_VERIFIER_COOKIE, "", { ...buildCookieOptions(), maxAge: 0 });
  store.set(OAUTH_NONCE_COOKIE, "", { ...buildCookieOptions(), maxAge: 0 });

  return { state, verifier, nonce };
}

export async function exchangeGoogleCode(code: string, verifier: string, baseUrl: string) {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: `${baseUrl}/api/auth/google/callback`,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GOOGLE_TOKEN_EXCHANGE_FAILED:${response.status}:${detail}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function verifyGoogleIdToken(idToken: string, expectedNonce: string) {
  const verified = await jwtVerify(idToken, jwks, {
    issuer: GOOGLE_ISSUER,
    audience: getGoogleClientId(),
  });

  const payload = verified.payload as GoogleIdTokenClaims;
  if (!payload.sub || !payload.email) throw new Error("GOOGLE_ID_TOKEN_MISSING_FIELDS");
  if (payload.nonce !== expectedNonce) throw new Error("GOOGLE_NONCE_MISMATCH");

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    givenName: payload.given_name?.trim() ?? "",
    familyName: payload.family_name?.trim() ?? "",
    fullName: payload.name?.trim() ?? "",
  };
}
