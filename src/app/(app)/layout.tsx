import { BottomNav } from "@/components/bottom-nav";
import { getCurrentSession } from "@/lib/auth/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  return (
    <div className="flex min-h-svh flex-col">
      <main className={session ? "flex-1 pb-20" : "flex-1"}>{children}</main>
      {session && <BottomNav />}
    </div>
  );
}
