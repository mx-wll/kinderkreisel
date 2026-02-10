# findln — Search & Filter Feature (Option 2a)

Adds text search and pricing filter to the home page using server-side Supabase `.ilike()` queries with URL search params. No database migrations required.

## Overview

| Aspect | Detail |
|--------|--------|
| Approach | Server-side filtering via Supabase `.ilike()` + `.eq()` |
| Location | Existing home page (`/`) |
| State management | URL search params (`?q=...&pricing=...`) |
| DB changes | None |
| New dependencies | None |

## Tasks

### 1. Create `SearchFilter` client component

- **File**: `src/components/search-filter.tsx`
- **Type**: Client component (`"use client"`)
- **Contains**:
  - Text input for search (placeholder: `"Artikel suchen..."`)
  - Select dropdown for pricing type filter with options:
    - `""` — Alle (all / default)
    - `"free"` — Zu verschenken
    - `"lending"` — Zum Leihen
    - `"other"` — Sonstiges
- **Behavior**:
  - On form submit (Enter key or button), updates URL search params `?q=<text>&pricing=<type>`
  - Uses `useRouter` + `useSearchParams` from `next/navigation`
  - Preserves existing param values on load (controlled inputs from URL)
  - Debounce is NOT needed — search triggers on explicit submit (Enter / button)
  - Clearing the input and submitting removes the `q` param
  - Selecting "Alle" removes the `pricing` param
- **UI**: Uses existing shadcn `Input`, `Select`, and `Button` components
- **Layout**: Search input and filter in a single responsive row below the page header

### 2. Update home page to read search params and filter query

- **File**: `src/app/(app)/page.tsx`
- **Changes**:
  - Accept `searchParams` prop (Next.js server component convention)
  - Read `q` and `pricing` from search params
  - Build Supabase query conditionally:
    - If `q` is present: add `.or('title.ilike.%${q}%,description.ilike.%${q}%')`
    - If `pricing` is present: add `.eq('pricing_type', pricing)`
  - Render `<SearchFilter />` component between header and item grid
  - Show "Keine Ergebnisse" empty state when search/filter returns 0 results (distinct from "no items exist" state)

### 3. Update empty state messaging

- No items at all (no search active): `"Noch keine Artikel vorhanden."` (existing)
- No results for search/filter: `"Keine Artikel gefunden. Versuch es mit einem anderen Suchbegriff."` (new)

## Out of Scope

- Full-text search (`tsvector`/`tsquery`) — future upgrade
- Category / item type filter — requires DB schema change
- Child age filter — requires DB schema change
- Dedicated `/items` browse page — future Option 3
- Debounced live search — not needed for explicit submit UX
- Search result ranking / relevance scoring

## Acceptance Criteria

- [ ] User can type a search term and press Enter to filter items by title or description
- [ ] User can select a pricing type to filter items
- [ ] Search and filter can be combined
- [ ] URL reflects current search state (shareable, back-button works)
- [ ] Clearing search/filter shows all items again
- [ ] Empty search results show a helpful German message
- [ ] No database migration needed
- [ ] All UI copy is in German
- [ ] Uses existing shadcn/ui components only