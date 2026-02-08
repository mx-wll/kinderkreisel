"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [pricing, setPricing] = useState(searchParams.get("pricing") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (pricing) params.set("pricing", pricing);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  function handlePricingChange(value: string) {
    const next = value === "all" ? "" : value;
    setPricing(next);
    // Submit immediately on filter change
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (next) params.set("pricing", next);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Artikel suchen..."
          className="pl-9"
        />
      </div>
      <Select value={pricing || "all"} onValueChange={handlePricingChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle</SelectItem>
          <SelectItem value="free">Zu verschenken</SelectItem>
          <SelectItem value="lending">Zum Leihen</SelectItem>
          <SelectItem value="other">Sonstiges</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" size="icon" variant="ghost" aria-label="Suchen">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
