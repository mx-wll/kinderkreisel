# Product Status

Last updated: 2026-03-09

## Current Runtime

### Authentication
- [x] Email/password signup
- [x] Google login
- [x] Email verification via Resend
- [x] Resend verification email action from login form
- [x] Password reset request + confirm flow
- [x] Sign in / sign out
- [x] Minimal signup with name, email, and password
- [x] ZIP-code onboarding enforced after auth
- [x] Optional legacy account claim flow (`/claim-account`)

### User Profiles
- [x] Profile creation during signup
- [x] Onboarding page for ZIP code, optional phone number, and optional address
- [x] View own profile
- [x] Edit profile (name, surname, ZIP, optional phone, optional address)
- [x] Toggle email notifications on profile
- [x] Upload / change / remove avatar
- [x] View other user profiles

### Items
- [x] Create item with photo, title, description, pricing, and category
- [x] Client-side image compression
- [x] Edit item
- [x] Delete item
- [x] 20 item limit per user
- [x] Item detail page
- [x] Home feed search + filters

### Reservations
- [x] Reserve button hidden on own items
- [x] One active reservation per item enforced in mutation logic
- [x] Seller and buyer can cancel active reservations
- [x] 48-hour auto-expiry via Convex cron
- [x] Seller phone number revealed to reserving buyer

### Messaging
- [x] In-app chat per item
- [x] Conversation list page
- [x] Conversation detail page
- [x] Unread badge
- [x] Realtime message updates via Convex subscriptions

### Legal + Account
- [x] Privacy page
- [x] Impressum page
- [x] Account deletion with cascade cleanup

### Infrastructure
- [x] Next.js 16 app structure
- [x] Convex integrated as primary backend
- [x] Convex storage uploads
- [x] Auth route handlers under `/api/auth/*`
- [x] Route protection via `src/proxy.ts`
- [ ] Vercel production deployment verified in docs

## Not Fully Implemented Yet

- [ ] Message digest email sending logic (cron exists, handler is still a placeholder)
- [ ] Reservation notification emails beyond auth emails
- [ ] Dedicated browse page separate from `/`
- [ ] Additional social login providers beyond Google
- [ ] Advanced search (ranking, typo tolerance, autocomplete)

## Notes

- The bottom navigation intentionally hides the `Stöbern` tab for now to match the current mobile design. The `/profiles` browse route and its functionality remain in the codebase for reuse in a future navigation pattern.

Older documents in this folder may describe Supabase-era plans or migration work. The current runtime backend is Convex.
