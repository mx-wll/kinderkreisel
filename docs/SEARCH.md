# findln — Search MVP Implementation Plan

Last updated: 2026-02-16

## 1) Why this exists

This document turns research + current app constraints into a practical, step-by-step implementation guide for a **working Search MVP** in the current stack:

- Next.js App Router
- Supabase Postgres (RLS enabled)
- Existing Home feed URL-state filters

Goal: ship a robust search/filter experience without adding paid external search infra.

---

## 2) Current app state (what we have now)

From the current codebase:

- Search is on `src/app/(app)/page.tsx`.
- Query is currently `ilike` over title + description.
- Filters currently supported via URL:
  - `q`, `category`, `size`, `shoe_size`, `pricing`
- UI is in `src/components/search-filter.tsx`.
- No autocomplete, no typo tolerance, no ranking model, no facets/counts, no pagination.

This means discovery works for simple exact text, but not for common marketplace search behavior (misspellings, mixed intent, category-scoped intent, zero-result recovery).

---

## 3) Research findings translated to this app

### 3.1 UX and behavior

- Baymard (2024) reports 41% of sites fail key query-type support; “exact/product type/feature/use case” support is foundational.
- Baymard autocomplete research shows most sites implement autocomplete, but execution quality is often weak (selection clarity, suggestion quality, flow control).
- Baymard “no results” research emphasizes recovery paths (alternative queries, category pivots, nearby matches).
- Baymard category-scope research highlights high failure rates when search doesn’t direct users into matching category scope.
- W3C APG combobox pattern defines required keyboard and focus behavior for accessible suggestion UIs.

### 3.2 Implementation architecture

- PostgreSQL + Supabase support production-grade full-text search with weighted `tsvector` + `GIN` index.
- PostgreSQL `pg_trgm` adds typo-tolerant similarity matching.
- Supabase docs recommend `websearch_to_tsquery` for user-entered search syntax and generated weighted columns for ranking.
- Faceting best practices: combine static core facets with query/category-relevant facets and support conjunctive/disjunctive behavior where needed.
- Query expansion should be controlled and primarily used as a fallback for low/zero-result queries.

---

## 4) Search MVP scope (must ship)

### In scope

1. Weighted FTS ranking (title > description)
2. Typo tolerance fallback via trigram similarity
3. Stable filtering across category + size + price
4. Autocomplete suggestions (query + category)
5. No-results recovery actions
6. Shareable URL state, back/forward friendly
7. Basic search analytics events

### Out of scope (later)

- Semantic/vector search
- Personalized ranking
- Merchandising rules UI
- Multi-language index variants

---

## 5) Data model + SQL changes (Supabase SQL editor)

Run these changes in order in Supabase SQL Editor (or migrations if you later add a `supabase/` migrations workflow).

## Step 1: enable required extensions

```sql
create extension if not exists unaccent;
create extension if not exists pg_trgm;
```

## Step 2: add weighted search document column

```sql
alter table public.items
add column if not exists search_document tsvector
generated always as (
  setweight(to_tsvector('german', unaccent(coalesce(title, ''))), 'A') ||
  setweight(to_tsvector('german', unaccent(coalesce(description, ''))), 'B') ||
  setweight(to_tsvector('simple', unaccent(coalesce(category, ''))), 'C') ||
  setweight(to_tsvector('simple', unaccent(coalesce(size, ''))), 'D') ||
  setweight(to_tsvector('simple', unaccent(coalesce(shoe_size, ''))), 'D')
) stored;
```

## Step 3: add search indexes

```sql
create index if not exists items_search_document_gin_idx
  on public.items using gin (search_document);

create index if not exists items_title_trgm_idx
  on public.items using gin (unaccent(lower(title)) gin_trgm_ops);

create index if not exists items_description_trgm_idx
  on public.items using gin (unaccent(lower(description)) gin_trgm_ops);

create index if not exists items_search_filter_idx
  on public.items (status, category, pricing_type, size, shoe_size, created_at desc);
```

## Step 4: create primary RPC for ranked search

```sql
create or replace function public.search_items_v1(
  p_query text default null,
  p_category text default null,
  p_pricing text default null,
  p_size text default null,
  p_shoe_size text default null,
  p_limit int default 40,
  p_offset int default 0
)
returns table (
  id uuid,
  seller_id uuid,
  title text,
  description text,
  pricing_type text,
  pricing_detail text,
  category text,
  size text,
  shoe_size text,
  image_url text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  rank_score real
)
language sql
stable
as $$
with base as (
  select i.*
  from public.items i
  where i.status = 'available'
    and (p_category is null or p_category = '' or i.category = p_category)
    and (p_pricing is null or p_pricing = '' or i.pricing_type = p_pricing)
    and (p_size is null or p_size = '' or i.size = p_size)
    and (p_shoe_size is null or p_shoe_size = '' or i.shoe_size = p_shoe_size)
),
scored as (
  select
    b.*,
    case
      when coalesce(trim(p_query), '') = '' then 0::real
      else ts_rank_cd(
        b.search_document,
        websearch_to_tsquery('german', unaccent(trim(p_query)))
      )
    end as fts_rank,
    case
      when coalesce(trim(p_query), '') = '' then 0::real
      else greatest(
        similarity(unaccent(lower(b.title)), unaccent(lower(trim(p_query)))),
        similarity(unaccent(lower(b.description)), unaccent(lower(trim(p_query))))
      )::real
    end as trigram_rank
  from base b
  where
    coalesce(trim(p_query), '') = ''
    or b.search_document @@ websearch_to_tsquery('german', unaccent(trim(p_query)))
    or unaccent(lower(b.title)) % unaccent(lower(trim(p_query)))
    or unaccent(lower(b.description)) % unaccent(lower(trim(p_query)))
)
select
  s.id, s.seller_id, s.title, s.description, s.pricing_type, s.pricing_detail,
  s.category, s.size, s.shoe_size, s.image_url, s.status, s.created_at, s.updated_at,
  (s.fts_rank * 0.8 + s.trigram_rank * 0.2)::real as rank_score
from scored s
order by
  case when coalesce(trim(p_query), '') = '' then 0 else 1 end desc,
  rank_score desc,
  s.created_at desc
limit greatest(p_limit, 1)
offset greatest(p_offset, 0);
$$;
```

## Step 5: add autocomplete suggestions RPC

```sql
create or replace function public.search_suggestions_v1(
  p_query text,
  p_limit int default 8
)
returns table (
  suggestion text,
  suggestion_type text
)
language sql
stable
as $$
with q as (
  select trim(coalesce(p_query, '')) as query
),
title_suggestions as (
  select distinct i.title as suggestion, 'query'::text as suggestion_type
  from public.items i, q
  where i.status = 'available'
    and q.query <> ''
    and unaccent(lower(i.title)) % unaccent(lower(q.query))
  order by i.title
  limit greatest(p_limit, 1)
),
category_suggestions as (
  select distinct i.category as suggestion, 'category'::text as suggestion_type
  from public.items i, q
  where i.status = 'available'
    and q.query <> ''
    and unaccent(lower(i.category)) like unaccent(lower(q.query)) || '%'
  limit 3
)
select * from title_suggestions
union all
select * from category_suggestions
limit greatest(p_limit, 1);
$$;
```

## Step 6: grant execution to authenticated users

```sql
grant execute on function public.search_items_v1(text, text, text, text, text, int, int) to authenticated;
grant execute on function public.search_suggestions_v1(text, int) to authenticated;
```

---

## 6) Next.js implementation steps

## Step 7: create typed search data layer

Add `src/lib/search.ts`:

- `searchItems(params)` calls `supabase.rpc("search_items_v1", ...)`
- `getSearchSuggestions(query)` calls `supabase.rpc("search_suggestions_v1", ...)`
- Map RPC rows to `ItemWithSeller` shape by joining seller profiles after RPC item IDs

Keep all server-side to preserve RLS and avoid exposing ranking logic client-side.

## Step 8: update home feed query path

In `src/app/(app)/page.tsx`:

- Replace the current `.or(title.ilike...,description.ilike...)` branch with `searchItems`.
- Keep URL search params as single source of truth.
- Add `page` param for pagination (`?page=2`).
- Use `limit=40` initial page.

## Step 9: upgrade search UI component

In `src/components/search-filter.tsx`:

- Add debounced suggestions dropdown under input (150–250ms debounce).
- Use combobox/listbox semantics per WAI APG:
  - Arrow key navigation
  - Enter to commit
  - Escape to close
  - Proper active option state
- Keep category chips, but add explicit “scope chip” behavior:
  - If user selects category suggestion, set `category=...` and keep query text.

## Step 10: improve filter UX

- Keep secondary chips, but always show currently applied filters.
- Add a visible `Alle Filter löschen` action.
- Show active result count above grid.
- Preserve filter state on back navigation and refresh (already URL-based; keep this behavior).

## Step 11: no-results recovery flow

If result set is empty:

1. Show suggestion: remove least-restrictive filter first (size/shoe_size, then pricing).
2. Show category pivots from top categories.
3. Show “Suche ohne Filter neu starten” one-click action.

Do not silently broaden query without user-visible indication.

## Step 12: lightweight analytics events

Create `search_events` table:

- `id`, `user_id`, `query`, `category`, `pricing`, `size`, `shoe_size`, `results_count`, `created_at`

Log one event per committed search and one per suggestion click (optional separate event type column).

This is needed to tune ranking, suggestions, and facet ordering later.

---

## 7) QA checklist (must pass before release)

## Functional

- Query finds exact titles and close misspellings.
- Category + size/shoe_size constraints work exactly as expected.
- Empty query + filters behaves like browse mode.
- Pagination does not duplicate or skip results.

## UX

- Suggestion list is clearly differentiated from final results.
- Applied filters are always visible and removable.
- No-results state provides at least 2 actionable next steps.

## Accessibility

- Keyboard-only user can open suggestions, navigate, select, dismiss.
- Screen reader announces combobox and option focus changes.

## Performance

- P95 search RPC < 300ms on seed dataset (150 items) and remains acceptable at 5k+ items.
- P95 suggestion RPC < 150ms.
- DB query plans show index usage (`GIN` for FTS/trigram).

---

## 8) Rollout plan

1. Ship behind feature flag `NEXT_PUBLIC_SEARCH_V2=true`.
2. Internal test on seed users first.
3. Enable for 20% of users.
4. Compare:
   - search-to-item-click rate
   - zero-result rate
   - average filters per successful session
5. Roll out to 100% if no regressions for 7 days.

---

## 9) Phase 2 (after MVP)

- Synonym table + admin curation (`jogger` ↔ `trainingshose`, etc.)
- Weighted boosts by freshness/engagement
- Dynamic facet ordering from click analytics
- Semantic fallback (hybrid search) for use-case/symptom-style queries

---

## 10) Primary references

- Baymard query-type support: https://baymard.com/blog/ecommerce-search-query-types
- Baymard autocomplete UX: https://baymard.com/blog/autocomplete-design
- Baymard no-results UX: https://baymard.com/blog/no-results-page
- Baymard category scope guidance: https://baymard.com/blog/autodirect-searches-matching-category-scopes
- W3C APG combobox pattern: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- PostgreSQL full-text search: https://www.postgresql.org/docs/current/textsearch.html
- PostgreSQL text search indexes: https://www.postgresql.org/docs/current/textsearch-indexes.html
- PostgreSQL `pg_trgm`: https://www.postgresql.org/docs/current/pgtrgm.html
- Supabase full-text search guide: https://supabase.com/docs/guides/database/full-text-search
- Supabase hybrid search guide: https://supabase.com/docs/guides/ai/hybrid-search
- Algolia faceting concepts: https://www.algolia.com/doc/guides/managing-results/refine-results/faceting
- Algolia typo tolerance concepts: https://www.algolia.com/doc/guides/managing-results/optimize-search-results/typo-tolerance
- Google Retail facets overview: https://cloud.google.com/retail/docs/facets-overview
- Google Retail query expansion: https://cloud.google.com/retail/docs/result-size
- Google Retail autocomplete controls: https://cloud.google.com/retail/docs/completion-overview
