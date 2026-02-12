# findln — Search & Filter Feature

Text search and multi-filter browse on the home page using server-side Supabase queries with URL search params.

## Overview

| Aspect | Detail |
|--------|--------|
| Approach | Server-side filtering via Supabase `.ilike()` + `.eq()` |
| Location | Home page (`/`) |
| State management | URL search params (`?q=...&category=...&size=...&shoe_size=...&pricing=...`) |
| Filter UI | Horizontal chip-based popovers (shadcn Popover) |

## Categories

| Slug | German Label | Has Sizes | Notes |
|------|-------------|-----------|-------|
| `clothing` | Kleidung | Yes (50–176) | Clothing sizes with age labels in UI |
| `shoes` | Schuhe | Yes (16–40) | EU kids shoe sizes |
| `toys` | Spielzeug | No | |
| `outdoor_sports` | Draußen & Sport | No | Bikes, skiing, ball sports |
| `other` | Sonstiges | No | Catch-all |

## Filter Chips

The filter row below the search bar uses horizontal scrollable chips:

```
[Alle Kategorien ▾] [Größe ▾] [Preis ▾]
```

- Each chip opens a **Popover** with selectable options
- Active filter: chip is filled/highlighted with primary color, shows value + × to clear
- **Size chip** only appears when category is `clothing` or `shoes`
  - Clothing sizes show age labels (e.g., "92 (ca. 2 J.)")
  - Shoe sizes show simple EU numbers (16–40)
- Chips update URL params and navigate immediately on selection

## URL Parameters

| Param | Values | Notes |
|-------|--------|-------|
| `q` | Free text | Searches title and description via `.ilike()` |
| `category` | `clothing`, `shoes`, `toys`, `outdoor_sports`, `other` | |
| `size` | `50`–`176` | Only when category = `clothing` |
| `shoe_size` | `16`–`40` | Only when category = `shoes` |
| `pricing` | `free`, `lending`, `other` | |

## Components

### `SearchFilter` (`src/components/search-filter.tsx`)

- Client component (`"use client"`)
- Search input + chip row
- Uses `useRouter` + `useSearchParams`
- Chips use shadcn `Popover` / `PopoverTrigger` / `PopoverContent`

### Home Page (`src/app/(app)/page.tsx`)

- Reads all search params from URL
- Builds Supabase query with conditional `.eq()` filters
- Shows empty state with helpful German message when no results

## Acceptance Criteria

- [x] User can type a search term and press Enter to filter items
- [x] User can filter by category (5 options)
- [x] Size filter appears only for clothing and shoes categories
- [x] Clothing sizes show age labels
- [x] User can filter by pricing type
- [x] All filters can be combined
- [x] URL reflects current search state (shareable, back-button works)
- [x] Active chips show selected value + × to clear
- [x] Clearing all filters shows all items again
- [x] Empty search results show a helpful German message
- [x] Mobile: chips scroll horizontally
- [x] All UI copy is in German
