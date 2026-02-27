# findln — Search Planning Notes (Historical)

Last updated: 2026-02-27

## Status

This document is a historical planning artifact from the Supabase-era search roadmap.

It does **not** describe the current runtime implementation.

Current implementation:
- Backend: Convex
- Search behavior: simple substring matching on item title + description
- Current reference: [SEARCH_FEATURE.md](./SEARCH_FEATURE.md)

## Why keep this file

It still contains useful product thinking for a future advanced search upgrade:
- full-text ranking
- typo tolerance
- suggestions/autocomplete
- faceting
- no-results recovery

## If search work resumes

Start from the current code instead of this document:
- `src/app/(app)/page.tsx`
- `src/components/search-filter.tsx`
- `convex/items.ts`
