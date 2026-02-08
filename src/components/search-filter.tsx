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
import { CLOTHING_SIZES } from "@/lib/types/database";

export function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [pricing, setPricing] = useState(searchParams.get("pricing") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [size, setSize] = useState(searchParams.get("size") ?? "");

  function buildParams(overrides: Record<string, string> = {}) {
    const values = { q: q.trim(), pricing, category, size, ...overrides };
    const params = new URLSearchParams();
    if (values.q) params.set("q", values.q);
    if (values.pricing) params.set("pricing", values.pricing);
    if (values.category) params.set("category", values.category);
    if (values.size && values.category === "clothes") params.set("size", values.size);
    return params;
  }

  function navigate(overrides: Record<string, string> = {}) {
    const qs = buildParams(overrides).toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate();
  }

  function handlePricingChange(value: string) {
    const next = value === "all" ? "" : value;
    setPricing(next);
    navigate({ pricing: next });
  }

  function handleCategoryChange(value: string) {
    const next = value === "all" ? "" : value;
    setCategory(next);
    if (next !== "clothes") setSize("");
    navigate({ category: next, size: next === "clothes" ? size : "" });
  }

  function handleSizeChange(value: string) {
    const next = value === "all" ? "" : value;
    setSize(next);
    navigate({ size: next });
  }

  return (
    <div className="mt-4 space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Artikel suchen..."
            className="pl-9"
          />
        </div>
        <Button type="submit" size="icon" variant="ghost" aria-label="Suchen">
          <Search className="h-4 w-4" />
        </Button>
      </form>
      <div className="flex gap-2">
        <Select value={category || "all"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            <SelectItem value="clothes">Kleidung</SelectItem>
            <SelectItem value="other">Sonstiges</SelectItem>
          </SelectContent>
        </Select>
        {category === "clothes" && (
          <Select value={size || "all"} onValueChange={handleSizeChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Größen</SelectItem>
              {CLOTHING_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  Gr. {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={pricing || "all"} onValueChange={handlePricingChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Preise</SelectItem>
            <SelectItem value="free">Zu verschenken</SelectItem>
            <SelectItem value="lending">Zum Leihen</SelectItem>
            <SelectItem value="other">Sonstiges</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
