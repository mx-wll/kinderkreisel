import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "kk_session";

export type SessionPayload = {
  profileId: string;
  email: string;
};

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, getSecret());
    const payload = verified.payload as Partial<SessionPayload>;
    if (!payload.profileId || !payload.email) return null;
    return { profileId: payload.profileId, email: payload.email };
  } catch {
    return null;
  }
}
