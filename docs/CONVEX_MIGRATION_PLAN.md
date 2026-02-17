# Supabase -> Convex Migration Plan

Last updated: 2026-02-17

## 1) Goals and constraints

- Keep current behavior from MVP + V1 (auth, items, reservations, chat, search filters, notifications).
- Minimize user-facing downtime and avoid data loss.
- Preserve German-only UI and existing routes.
- Stay practical for a solo maintainer and free/low-cost tiers.

## 2) Current Supabase surface area to replace

From project docs + code:

- Auth: email/password, verify email, password reset, session middleware.
- Database: `profiles`, `children`, `items`, `reservations`, `conversations`, `messages`.
- Access control: RLS policies on all tables.
- Realtime: unread badge and chat updates from `messages`.
- Storage: public buckets (`avatars`, `items`) + upload/remove flows.
- Backend jobs and triggers:
  - reservation email on reservation insert
  - reservation expiry every 15 minutes
  - message digest every 6 hours
- Search: SQL `.ilike()` today, with documented FTS/trigram MVP plan.

## 3) Target architecture on Convex

- Convex DB for app data and access rules in functions.
- Convex Auth (or Clerk/Auth.js + Convex integration) for identity and sessions.
- Convex Storage for avatars and item photos.
- Convex queries/mutations/actions for all server logic currently done in SQL triggers, server actions, and API routes.
- Convex scheduled functions to replace `pg_cron`.
- Convex realtime subscriptions to replace Supabase Realtime.
- Next.js app keeps App Router, but data access moves from Supabase clients to `convex/react` + `convex/nextjs`.

## 4) Data model mapping

## IDs and relationships

- Keep UUID-style external IDs where needed for compatibility, but use Convex `Id<"table">` internally.
- Add explicit indexes in Convex schema for all major query paths.

## Table -> Convex collection mapping

- `profiles` -> `profiles`
  - key fields: userId (unique), name, surname, residency, zipCode, phone, avatarStorageId, phoneConsent, emailNotifications, lastMessageEmailAt, createdAt, updatedAt
- `children` -> `children`
  - profileId index, age, gender, createdAt
- `items` -> `items`
  - sellerProfileId index, title, description, pricingType, pricingDetail, category, size, shoeSize, imageStorageId, status, createdAt, updatedAt
- `reservations` -> `reservations`
  - itemId index, buyerProfileId index, status, createdAt, expiresAt
  - enforce one active reservation per item in mutation logic
- `conversations` -> `conversations`
  - itemId + buyerProfileId unique pair behavior in mutation logic, sellerProfileId, createdAt, updatedAt
- `messages` -> `messages`
  - conversationId index, senderProfileId, content (max 2000), readAt, createdAt

## 5) Auth migration plan

Decision to make first: provider strategy.

- Option A (recommended for speed): keep current auth UX via Auth.js/Clerk and map user identity into Convex.
- Option B: move fully to Convex Auth primitives if feature parity for verification/reset and middleware behavior matches your needs.

Execution:

1. Implement new auth provider in parallel to Supabase auth routes.
2. Add `userId` mapping in `profiles` and create profile-on-signup logic in Convex mutation (replacing SQL trigger).
3. Replace middleware checks (`src/lib/supabase/middleware.ts`) with auth provider + Convex-compatible session checks.
4. Migrate login/signup/reset/update-password UI handlers from Supabase calls to new auth API.

## 6) Storage migration plan

1. Introduce Convex storage upload flow for:
   - `avatars/{userId}/avatar.ext`
   - `items/{userId}/{itemId}.ext`
2. Replace `getStorageUrl` helper and all `supabase.storage` upload/remove calls.
3. Backfill existing files:
   - export list of Supabase storage objects
   - upload to Convex storage
   - store new storage IDs in migrated docs
4. Keep image compression logic unchanged.

## 7) Backend logic migration plan

Replace Supabase SQL/RLS/triggers with Convex functions:

- Access rules:
  - enforce "own profile only updates", "own items only update/delete", "conversation participant only", etc. in each mutation/query.
- Reservations:
  - reserve mutation enforces not-own-item + active reservation uniqueness + 48h expiry timestamp.
  - cancel mutation checks seller ownership.
- Chat:
  - start/find conversation mutation enforces one conversation per (item, buyer).
  - send message mutation enforces participant membership and content limit.
  - mark-read mutation only for recipient.
- Account deletion:
  - single Convex mutation/action that removes user data and storage files (replacing `/api/account` + service role key flow).

## 8) Scheduled jobs and notifications migration

Replace `pg_cron` + `pg_net` + Edge Functions with Convex scheduled functions/actions:

- Job A (every 15 min): expire active reservations where `expiresAt < now`, set item status to `available`.
- Job B (every 6 h): unread message digest per user since `lastMessageEmailAt`, then update timestamp.
- Event-triggered notification:
  - call email action directly in reservation mutation.

Email provider:

- Reuse Resend; move key management to Convex environment variables.
- Port `send-notification` and `send-message-digest` logic into Convex actions.

## 9) Search migration

You currently use query/filter in app code and have a documented Supabase SQL FTS roadmap.

For Convex migration:

- Phase 1 parity:
  - keep current search behavior (`q`, `category`, `size`, `shoe_size`, `pricing`) as Convex query filters.
- Phase 2 quality:
  - add external search integration (recommended: Algolia/Typesense/Meilisearch) if you need typo tolerance + ranking equivalent to planned FTS/trigram.
  - keep Convex as source of truth, sync index on item create/update/delete.

## 10) App code migration sequence

## Phase 0: prep

1. Add Convex packages/config (`convex`, generated API, provider wiring).
2. Add new env vars while keeping Supabase vars intact.

## Phase 1: dual-read non-critical views

1. Migrate read-only pages first (`/profiles`, `/profiles/[id]`, feed reads).
2. Keep Supabase writes active until parity verified.

## Phase 2: writes and mutations

1. Migrate items create/edit/delete.
2. Migrate reservations flow.
3. Migrate chat (conversation + messages + unread counts).
4. Migrate profile edits + avatar.

## Phase 3: auth + middleware cutover

1. Switch auth handlers and session middleware.
2. Remove Supabase auth dependencies from UI forms and route handlers.

## Phase 4: background jobs + notifications

1. Enable Convex schedulers.
2. Disable Supabase cron jobs and triggers after verification window.

## Phase 5: cleanup

1. Remove `@supabase/ssr` and `@supabase/supabase-js` dependencies.
2. Remove `src/lib/supabase/*`, Supabase env vars, and SQL migration docs no longer used.
3. Update architecture and runbook docs.

## 11) Data migration runbook (minimal downtime)

1. Freeze writes (maintenance window).
2. Export Supabase data in dependency order:
   - profiles -> children -> items -> reservations -> conversations -> messages
3. Import into Convex with ID mapping table.
4. Migrate storage files and patch item/avatar refs.
5. Run integrity checks:
   - record counts per entity
   - orphan checks for each relationship
   - active reservation uniqueness
   - message/conversation membership consistency
6. Unfreeze writes and monitor.

## 12) Testing and acceptance checklist

- Auth: signup, verify, login, logout, reset password.
- Profile: view/edit, avatar upload/remove, children edits.
- Items: create/edit/delete, 20-item limit, seller-only mutations.
- Reservations: reserve/cancel/auto-expire.
- Chat: start conversation, realtime message delivery, unread/read states.
- Search/filter URL behavior unchanged.
- Notifications:
  - reservation immediate mail
  - digest mail every 6 hours
- Account deletion removes data and files.
- Performance check on feed/search/chat queries.

## 13) Rollout strategy

- Use a feature flag (`NEXT_PUBLIC_BACKEND=convex|supabase`) during migration.
- Run dual-write only where needed and time-box it (to avoid drift complexity).
- Start with internal users, then staged rollout (10% -> 50% -> 100%).
- Keep Supabase as rollback target until 7-day stability window passes.

## 14) Risks and mitigations

- Auth parity risk (verification/reset/session behavior)
  - mitigate with early auth spike and end-to-end auth tests.
- Search relevance regression
  - ship parity first, then move to dedicated search service if needed.
- Access control regressions (RLS -> app logic)
  - enforce centralized auth checks in Convex functions + tests.
- Data drift during cutover
  - short write freeze + scripted import validation.

## 15) Effort estimate (solo dev, pragmatic)

- Discovery + schema/auth spike: 2-3 days
- Core migration (data layer + pages + mutations): 7-12 days
- Jobs/notifications/search parity: 2-4 days
- Cutover + hardening + cleanup: 2-3 days

Expected total: ~2-3 weeks part-time focused execution.
