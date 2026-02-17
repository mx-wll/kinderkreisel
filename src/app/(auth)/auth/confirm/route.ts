import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? searchParams.get("token_hash");
  if (token) {
    redirect(`/auth/update-password?token=${encodeURIComponent(token)}`);
  }
  redirect("/auth/error?error=Ungültiger%20Best%C3%A4tigungslink");
}
