"use client";

import { useEffect } from "react";

export function ReferralActivationPing({ trigger }: { trigger: string }) {
  useEffect(() => {
    void fetch("/api/referrals/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger }),
    }).catch(() => undefined);
  }, [trigger]);

  return null;
}
