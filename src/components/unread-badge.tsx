"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function UnreadBadge() {
  const [userId, setUserId] = useState<string | null>(null);
  const convexCount = useQuery(
    api.chat.getUnreadCountForUser,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    async function init() {
      const me = (await fetch("/api/auth/me").then((r) => r.json())) as {
        user: { id: string } | null;
      };
      const user = me.user;
      if (!user) return;
      setUserId(user.id);
    }

    init();
  }, []);

  const displayCount =
    typeof convexCount === "number" ? convexCount : 0;
  if (displayCount === 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
      {displayCount > 99 ? "99+" : displayCount}
    </span>
  );
}
