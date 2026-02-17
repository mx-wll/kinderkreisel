# Supabase -> Convex Execution Checklist

Last updated: 2026-02-17

## 0) Setup and wiring

- [x] Install Convex dependency
- [x] Authenticate Convex CLI on this machine
- [x] Link repository to existing Convex project
- [x] Provision dev deployment and write `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL`
- [x] Generate Convex client/server types

## 1) Backend foundation

- [x] Create Convex schema for: profiles, children, items, reservations, conversations, messages
- [x] Add table indexes for primary read paths
- [x] Add migration utility mutations (clear/import/count)
- [x] Add basic app queries/mutations for key flows (feed, reservations, chat, profile)

## 2) Data migration tooling

- [x] Create script to export from Supabase and import into Convex in dependency order
- [x] Add migration verification counts command path
- [x] Run data migration against production Supabase data
- [x] Verify imported counts match source counts

## 3) App cutover (code)

- [x] Replace Supabase read paths with Convex queries (completed for `/`, `/profiles`, `/profiles/[id]`, `/items/[id]`, `/messages`, `/messages/[id]`, `/profile` behind `NEXT_PUBLIC_BACKEND_PROVIDER=convex`)
- [x] Replace Supabase write paths with Convex mutations/actions (completed for reserve/cancel/start-chat, item create/edit/delete, profile update/avatar, account deletion data cleanup behind backend flag)
- [x] Replace realtime subscriptions with Convex subscriptions (completed for chat messages and unread badge in Convex mode)
- [x] Replace Supabase storage upload/remove with Convex storage
- [x] Replace Supabase auth with Convex-compatible auth stack
- [x] Remove Supabase middleware/session code
- [x] Add one-time legacy account claim flow and gating toggle (`ENABLE_ACCOUNT_CLAIM`)

## 4) Background jobs and notifications

- [ ] Implement reservation expiry scheduler in Convex
- [ ] Implement message digest scheduler in Convex
- [ ] Port reservation email + digest email actions (Resend)
- [ ] Set Convex environment variables/secrets

## 5) Verification and cleanup

- [ ] Run end-to-end acceptance checklist (auth, items, reservations, chat, search)
- [x] Convex is default/only backend in app runtime code
- [x] Remove Supabase packages and dead code
- [ ] Update docs (`ARCHITECTURE.md`, `TECH.md`, `DATABASE.md`, `CHANGELOG.md`)
