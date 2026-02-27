# findln — Search & Filter Feature

Last updated: 2026-02-27

Search and filter currently live on the signed-in home feed (`/`). The implementation is intentionally simple and uses Convex queries plus URL search params.

## Overview

| Aspect | Detail |
|--------|--------|
| Approach | Server-side feed load + Convex filtering in `items:listAvailable` |
| Location | Home page (`/`) for signed-in users |
| Guest behavior | Guests see a landing page instead of the feed |
| State management | URL search params (`?q=...&category=...&size=...&shoe_size=...&pricing=...`) |
| Filter UI | Category buttons + popover chips for size and pricing |

## Current Behavior

- Text search matches item `title` and `description` using case-insensitive substring checks.
- Category, pricing, clothing size, and shoe size filters can be combined.
- The search/filter UI updates the URL so links remain shareable.
- Empty states distinguish between “no items yet” and “no results for current filters”.

## URL Parameters

| Param | Values | Notes |
|-------|--------|-------|
| `q` | Free text | Matches title and description |
| `category` | `clothing`, `shoes`, `toys`, `outdoor_sports`, `other` | |
| `size` | Clothing sizes | Only relevant when `category=clothing` |
| `shoe_size` | Shoe sizes | Only relevant when `category=shoes` |
| `pricing` | `free`, `lending`, `other` | |

## UI Structure

### Primary filters

Always visible:
- Search input
- Category buttons (`Alle` + category list)

### Secondary filters

Conditionally shown:
- Size chip when category is `clothing` or `shoes`
- Pricing chip when active or when the control is opened

## Key Files

- `src/app/(app)/page.tsx`
- `src/components/search-filter.tsx`
- `convex/items.ts`
- `src/lib/types/database.ts`

## Acceptance Criteria

- [x] User can search by free text
- [x] User can filter by category
- [x] User can filter by pricing type
- [x] Clothing and shoe sizes are category-aware
- [x] Filters are reflected in the URL
- [x] Empty results show a German fallback message
- [x] Works on mobile with horizontal scrolling controls

## Out of Scope in Current Implementation

These are not yet implemented in runtime code:
- Full-text ranking
- Typo tolerance
- Suggestions/autocomplete
- Facets/counts
- Search analytics

For older FTS exploration, see [SEARCH.md](./SEARCH.md), which is now a historical planning document rather than the current implementation.
