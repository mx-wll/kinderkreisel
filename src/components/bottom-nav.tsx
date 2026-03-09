"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnreadBadge } from "@/components/unread-badge";

const primaryTabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/items/new", label: "Einstellen", icon: PlusCircle },
  { href: "/messages", label: "Nachrichten", icon: MessageCircle },
  { href: "/profile", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2">
      <div className="mx-auto flex w-fit justify-center rounded-[10px] border border-white bg-[#faf6f0] p-0.5 shadow-[0_12px_40px_rgba(15,15,15,0.08)] backdrop-blur-[2.3px]">
        {primaryTabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex h-14 flex-col items-center justify-center rounded-[8px] px-3 text-[12px] leading-4 transition-colors",
                isActive
                  ? "bg-black text-white"
                  : "text-[#737373] hover:text-foreground"
              )}
            >
              <span className="relative mb-1 flex h-5 w-5 items-center justify-center">
                <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.25]" : "stroke-[1.9]")} />
                {tab.href === "/messages" && <UnreadBadge />}
              </span>
              <span
                className={cn(
                  isActive && (tab.href === "/" || tab.href === "/profile")
                    ? "font-medium"
                    : "font-normal"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
