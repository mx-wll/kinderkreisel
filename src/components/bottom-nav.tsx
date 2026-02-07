"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/profiles", label: "Stöbern", icon: Users },
  { href: "/items/new", label: "Einstellen", icon: PlusCircle },
  { href: "/profile", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon
                className={cn("h-5 w-5", isActive && "stroke-[2.5]")}
              />
              <span className={cn(isActive && "font-medium")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
