"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CATEGORIES,
  CLOTHING_SIZES,
  CLOTHING_SIZE_LABELS,
  SHOE_SIZES,
} from "@/lib/types/database";

const PRICING_OPTIONS = [
  { value: "free", label: "Zu verschenken" },
  { value: "lending", label: "Zum Leihen" },
  { value: "other", label: "Sonstiges" },
] as const;

export function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [sizeOpen, setSizeOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const category = searchParams.get("category") ?? "";
  const size = searchParams.get("size") ?? "";
  const shoeSize = searchParams.get("shoe_size") ?? "";
  const pricing = searchParams.get("pricing") ?? "";

  function navigate(overrides: Record<string, string>) {
    const current: Record<string, string> = {
      q: q.trim(),
      category,
      size,
      shoe_size: shoeSize,
      pricing,
    };
    const merged = { ...current, ...overrides };

    if (overrides.category !== undefined) {
      if (overrides.category !== "clothing") merged.size = "";
      if (overrides.category !== "shoes") merged.shoe_size = "";
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ q: q.trim() });
  }

  const showSizeChip = category === "clothing" || category === "shoes";
  const activeSizeValue = category === "clothing" ? size : shoeSize;
  const sizeOptions =
    category === "clothing"
      ? CLOTHING_SIZES.map((s) => ({ value: s, label: CLOTHING_SIZE_LABELS[s] ?? s }))
      : category === "shoes"
        ? SHOE_SIZES.map((s) => ({ value: s, label: s }))
        : [];
  const sizeParamKey = category === "clothing" ? "size" : "shoe_size";
  const pricingLabel = PRICING_OPTIONS.find((p) => p.value === pricing)?.label;

  return (
    <div className="mt-4 space-y-3">
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

      {/* Category buttons — always visible */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => navigate({ category: "" })}
          className={`shrink-0 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
            !category
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          Alle
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => navigate({ category: c.slug })}
            className={`shrink-0 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
              category === c.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Secondary filters — size + pricing chips */}
      {(showSizeChip || pricing) && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          {showSizeChip && (
            <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    activeSizeValue
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  {activeSizeValue ? `Gr. ${activeSizeValue}` : "Größe"}
                  {activeSizeValue ? (
                    <X
                      className="h-3.5 w-3.5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate({ [sizeParamKey]: "" });
                      }}
                    />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="max-h-64 w-48 overflow-y-auto p-1">
                {sizeOptions.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`w-full rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                      activeSizeValue === s.value ? "bg-accent font-medium" : ""
                    }`}
                    onClick={() => {
                      navigate({ [sizeParamKey]: s.value });
                      setSizeOpen(false);
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}

          <Popover open={pricingOpen} onOpenChange={setPricingOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  pricing
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent"
                }`}
              >
                {pricingLabel ?? "Preis"}
                {pricing ? (
                  <X
                    className="h-3.5 w-3.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate({ pricing: "" });
                    }}
                  />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-1">
              {PRICING_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`w-full rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    pricing === p.value ? "bg-accent font-medium" : ""
                  }`}
                  onClick={() => {
                    navigate({ pricing: p.value });
                    setPricingOpen(false);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
