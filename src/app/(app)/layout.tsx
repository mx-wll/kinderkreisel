import { AppShell } from "@/components/app-shell";
import { getCurrentSession } from "@/lib/auth/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  return <AppShell showBottomNav={Boolean(session)}>{children}</AppShell>;
}
