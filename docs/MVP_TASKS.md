# MVP Build — Granular Task List

This is the step-by-step build plan for the Kinderkreisel MVP. Each task is small enough to pick up independently. Check off tasks as they are completed.

---

## Phase 1: Project Scaffolding

- [x] **1.1** Initialize Next.js 15 project with TypeScript strict, pnpm, App Router
- [x] **1.2** Install and configure Tailwind CSS v4
- [x] **1.3** Initialize shadcn/ui (set up `components.json`, install `cn` util)
- [x] **1.4** Install core shadcn components: Button, Input, Label, Card, Textarea, Select, Checkbox, Avatar, Tabs, Badge, Separator, Dialog, DropdownMenu, Toast/Sonner
- [x] **1.5** Install Supabase client packages (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] **1.6** Create `.env.local` from `.env.example` with Supabase credentials
- [x] **1.7** Create Supabase client utilities (`lib/supabase/client.ts` for browser, `lib/supabase/server.ts` for server components, `lib/supabase/middleware.ts` for session refresh)
- [x] **1.8** Create Next.js middleware (`middleware.ts`) for auth session refresh on every request
- [x] **1.9** Install `browser-image-compression` package
- [x] **1.10** Set up root layout (`app/layout.tsx`) with German `<html lang="de">`, font, metadata, Toaster
- [x] **1.11** Create global TypeScript types (`lib/types/database.ts`) matching the DB schema
- [x] **1.12** Verify dev server runs without errors (`pnpm dev`)

---

## Phase 2: Database Schema (Supabase Migrations)

- [x] **2.1** Enable `pg_cron` and `moddatetime` extensions
- [x] **2.2** Create `profiles` table (id, name, surname, residency, zip_code, phone, avatar_url, phone_consent, created_at, updated_at)
- [x] **2.3** Create `children` table (id, profile_id FK, age, gender, created_at)
- [x] **2.4** Create `items` table (id, seller_id FK, title, description, pricing_type, pricing_detail, image_url, status, created_at, updated_at)
- [x] **2.5** Create `reservations` table (id, item_id FK, buyer_id FK, status, created_at, expires_at) with unique partial index on (item_id) WHERE status = 'active'
- [x] **2.6** Create `update_updated_at` trigger function + attach to `profiles` and `items`
- [x] **2.7** Create `on_auth_user_created` trigger function — auto-inserts a profile row from `auth.users` raw_user_meta_data
- [x] **2.8** Create indexes: items(seller_id), items(created_at DESC), items(status), reservations(buyer_id)
- [x] **2.9** Create `pg_cron` job: every 15 min, expire reservations and reset item status

---

## Phase 3: RLS Policies & Storage

- [x] **3.1** Enable RLS on all 4 tables (profiles, children, items, reservations)
- [x] **3.2** Add RLS policies for `profiles` (SELECT any auth, INSERT/UPDATE/DELETE own only)
- [x] **3.3** Add RLS policies for `children` (SELECT any auth, INSERT/UPDATE/DELETE own only)
- [x] **3.4** Add RLS policies for `items` (SELECT any auth, INSERT own + max 20 check, UPDATE/DELETE own only)
- [x] **3.5** Add RLS policies for `reservations` (SELECT buyer or seller, INSERT any auth, UPDATE seller only for cancel, no DELETE)
- [x] **3.6** Create `avatars` storage bucket (public, upload restricted to auth users, path = `{user_id}/`)
- [x] **3.7** Create `items` storage bucket (public, upload restricted to auth users, path = `{user_id}/`)
- [x] **3.8** Verify RLS & storage policies via quick SQL test queries

---

## Phase 4: Authentication Pages

- [x] **4.1** Create auth layout (`app/(auth)/layout.tsx`) — centered card layout, no bottom nav
- [x] **4.2** Build signup page (`app/(auth)/signup/page.tsx`) — form with: email, password, name, surname, residency, phone, zip code (locked to 83623), privacy consent checkbox
- [x] **4.3** Wire signup form to Supabase Auth `signUp()` with user metadata (name, surname, residency, phone, zip_code, phone_consent)
- [x] **4.4** Build login page (`app/(auth)/login/page.tsx`) — email + password form
- [x] **4.5** Wire login form to Supabase Auth `signInWithPassword()`
- [x] **4.6** Build password reset page (`app/(auth)/reset-password/page.tsx`) — email input, sends reset link
- [x] **4.7** Build password update page (`app/(auth)/update-password/page.tsx`) — new password form after clicking reset link
- [x] **4.8** Create auth confirm route (`app/(auth)/auth/confirm/route.ts`) — exchanges token_hash for session (email verify + password reset)
- [x] **4.9** Add redirect logic: unauthenticated users → `/login`, authenticated users on auth pages → `/`
- [x] **4.10** Add sign-out action/button (reusable, used later in profile page)
- [x] **4.11** Build passes, auth forms compile — end-to-end testing deferred to Phase 16

---

## Phase 5: App Shell & Navigation

- [x] **5.1** Create app layout for authenticated pages (`app/(app)/layout.tsx`) with bottom tab bar
- [x] **5.2** Build `BottomNav` component — 4 tabs: Home (`/`), Profiles (`/profiles`), Add Item (`/items/new`), My Profile (`/profile`)
- [x] **5.3** Style active tab indicator, icons for each tab (use Lucide icons from shadcn)
- [x] **5.4** Make layout mobile-first: content area scrolls, bottom nav fixed
- [x] **5.5** Add auth guard — check session server-side, redirect to `/login` if not authenticated (handled in middleware)

---

## Phase 6: Home Feed (Items List)

- [ ] **6.1** Create Home page (`app/(app)/page.tsx`) — server component that fetches all items with status='available', sorted by created_at DESC, joined with seller profile (name, avatar)
- [ ] **6.2** Build `ItemCard` component — shows image, title, pricing badge, seller name + avatar, time ago
- [ ] **6.3** Build the item feed grid layout (responsive: 1 col mobile, 2 cols tablet)
- [ ] **6.4** Add empty state: "Noch keine Artikel vorhanden."
- [ ] **6.5** Add pull-to-refresh or manual refresh mechanism

---

## Phase 7: Item Detail Page

- [ ] **7.1** Create item detail page (`app/(app)/items/[id]/page.tsx`) — server component, fetch item + seller profile + active reservation
- [ ] **7.2** Display: full image, title, description, pricing info, seller name/avatar, posted date
- [ ] **7.3** Show "Reservieren" button if item is available AND viewer is NOT the seller
- [ ] **7.4** Wire reserve button — calls Supabase insert on reservations, updates item status to 'reserved'
- [ ] **7.5** After reservation: show seller phone number with WhatsApp link + call link
- [ ] **7.6** If item already reserved by current user: show phone number + expiry countdown
- [ ] **7.7** If item reserved by someone else: show "Reserviert" badge, no action
- [ ] **7.8** If current user is seller: show edit/delete buttons instead of reserve
- [ ] **7.9** Handle item not found (404 page)

---

## Phase 8: Create Item

- [ ] **8.1** Create "Add Item" page (`app/(app)/items/new/page.tsx`) — form with: photo upload, title, description, pricing type select, pricing detail (conditional)
- [ ] **8.2** Build image upload component with camera/gallery picker, preview, and client-side compression (800px, ~200KB via browser-image-compression)
- [ ] **8.3** Wire form submission: compress image → upload to `items/{user_id}/{item_id}.ext` in Supabase Storage → insert item row in DB
- [ ] **8.4** Add form validation: photo required, title required (max 100 chars), description required (max 1000 chars)
- [ ] **8.5** Enforce 20-item limit — check count before showing form, show friendly error if at max
- [ ] **8.6** Redirect to item detail page after successful creation
- [ ] **8.7** Add loading/submitting state to prevent double-submit

---

## Phase 9: Edit & Delete Item

- [ ] **9.1** Create edit item page (`app/(app)/items/[id]/edit/page.tsx`) — same form as create, pre-filled with existing data
- [ ] **9.2** Allow changing photo (re-upload + re-compress), title, description, pricing
- [ ] **9.3** Wire update to Supabase (update item row, replace image in storage if changed)
- [ ] **9.4** Only the seller can access edit page (redirect others away)
- [ ] **9.5** Add delete item action — confirm dialog → delete from DB (cascade removes reservations) → delete image from storage → redirect to profile
- [ ] **9.6** Prevent editing/deleting while item is reserved (or allow with warning)

---

## Phase 10: My Profile Page

- [ ] **10.1** Create My Profile page (`app/(app)/profile/page.tsx`) — server component, fetch own profile + children + own items + reservations (as buyer)
- [ ] **10.2** Display profile info: avatar, name, surname, residency, phone
- [ ] **10.3** Add "Edit Profile" button → navigates to edit view or opens inline form
- [ ] **10.4** Build profile edit form: name, surname, residency, phone, children (add/remove/edit)
- [ ] **10.5** Build avatar upload component — compress + upload to `avatars/{user_id}/avatar.ext`, update profile.avatar_url
- [ ] **10.6** Allow removing avatar (delete from storage, set avatar_url to null)
- [ ] **10.7** List "Meine Artikel" section — grid of own items with edit/delete actions
- [ ] **10.8** Empty state for own items: "Du hast noch keine Artikel. Jetzt etwas einstellen!" with link to `/items/new`
- [ ] **10.9** List "Meine Reservierungen" section — items the user has reserved, with expiry countdown, seller phone
- [ ] **10.10** Empty state for reservations: "Keine aktiven Reservierungen."
- [ ] **10.11** Seller's active reservations: list items that others have reserved, with cancel button
- [ ] **10.12** Wire cancel reservation action — update reservation status to 'cancelled', item status back to 'available'
- [ ] **10.13** Add sign-out button
- [ ] **10.14** Add "Account löschen" (delete account) button — confirm dialog → deletes profile (cascade) + auth user → redirect to login

---

## Phase 11: Profiles List & Public Profile

- [ ] **11.1** Create Profiles list page (`app/(app)/profiles/page.tsx`) — fetch all profiles, sorted by item count DESC
- [ ] **11.2** Build `ProfileCard` component — avatar, name, item count badge
- [ ] **11.3** Add empty state: "Noch keine Nutzer registriert."
- [ ] **11.4** Create public profile page (`app/(app)/profiles/[id]/page.tsx`) — fetch profile + their items
- [ ] **11.5** Display: avatar, name, residency, list of their available items
- [ ] **11.6** Tapping an item navigates to the item detail page

---

## Phase 12: Reservation Logic (Server-Side)

- [ ] **12.1** Verify `pg_cron` job runs correctly — test with a reservation that should expire
- [ ] **12.2** Test concurrent reservation attempts (only one should succeed due to unique partial index)
- [ ] **12.3** Verify seller can cancel reservation → item goes back to 'available'
- [ ] **12.4** Verify cascade delete: deleting an item removes its reservations
- [ ] **12.5** Verify cascade delete: deleting a profile removes items + reservations

---

## Phase 13: Privacy & Legal

- [ ] **13.1** Create privacy policy page (`app/(app)/privacy/page.tsx`) — static German text covering GDPR basics
- [ ] **13.2** Create Impressum placeholder page (`app/(app)/impressum/page.tsx`) — "Wird vor Launch ergänzt"
- [ ] **13.3** Link privacy policy from signup form (consent checkbox links to it)
- [ ] **13.4** Link privacy + impressum from footer or profile page

---

## Phase 14: Polish & Empty States

- [ ] **14.1** Verify all empty states show correct German messages with CTAs
- [ ] **14.2** Add loading skeletons for feed, profile, and detail pages
- [ ] **14.3** Add toast notifications for success/error on all mutations (create, edit, delete, reserve, cancel)
- [ ] **14.4** Mobile viewport: ensure no horizontal scroll, proper spacing, tap targets ≥ 44px
- [ ] **14.5** Test on small screens (375px width) — fix any layout issues
- [ ] **14.6** Consistent error handling: show user-friendly German messages for all Supabase errors

---

## Phase 15: Seed Data

- [ ] **15.1** Write seed script (`scripts/seed.ts`) — creates 10 dummy users via Supabase Auth admin API
- [ ] **15.2** Each user gets a profile with German names, phone numbers, residency in 83623
- [ ] **15.3** Each user gets 15 items with stock photos (from Unsplash URLs or local assets), German titles/descriptions, random pricing types
- [ ] **15.4** Run seed script against Supabase and verify data appears correctly in the app

---

## Phase 16: Deployment & Final Check

- [ ] **16.1** Push to GitHub repo
- [ ] **16.2** Connect repo to Vercel, set environment variables
- [ ] **16.3** Deploy to Vercel and verify the app works in production
- [ ] **16.4** Test full user journey on mobile: signup → browse → item detail → reserve → view phone → create item → edit → delete → profile edit → logout
- [ ] **16.5** Test password reset flow end-to-end in production
- [ ] **16.6** Update PRODUCT_STATUS.md — check off all completed MVP items
- [ ] **16.7** Update ARCHITECTURE.md with final project structure
- [ ] **16.8** Update CHANGELOG.md with MVP completion entry

---

## Quick Reference: Picking Up Where You Left Off

When starting a new session:

1. Read this file (`docs/MVP_TASKS.md`) to see what's done
2. Read `docs/PRODUCT_STATUS.md` for feature-level status
3. Run `pnpm dev` to verify the app still builds
4. Check `git log --oneline -20` for recent changes
5. Check Supabase tables via `mcp__supabase__list_tables` to see what's deployed
6. Find the first unchecked task and continue from there
