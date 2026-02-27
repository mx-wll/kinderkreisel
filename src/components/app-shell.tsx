"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

export function AppShell({
  children,
  showBottomNav,
}: {
  children: React.ReactNode;
  showBottomNav: boolean;
}) {
  const pathname = usePathname();
  const isConversationRoute = pathname.startsWith("/messages/");

  return (
    <div className="flex min-h-svh flex-col">
      <main className={showBottomNav && !isConversationRoute ? "flex-1 pb-20" : "flex-1"}>
        {children}
      </main>
      {showBottomNav && !isConversationRoute && <BottomNav />}
    </div>
  );
}
