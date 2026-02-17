import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, SessionPayload, verifySession } from "./session";

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}

export async function requireCurrentSession() {
  const session = await getCurrentSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
