# Architecture

Last updated: 2026-02-27

## Overview

findln is a mobile-first marketplace built with Next.js 16 (App Router) on the frontend and Convex for app data, realtime updates, storage, and background jobs. Authentication is app-managed through Next.js route handlers and a signed session cookie.

## High-Level Architecture

```text
Browser (mobile-first web app)
    |
    +- Next.js App (Vercel)
    |    +- App Router pages and layouts
    |    +- Route handlers under /api/auth/* and /api/account
    |    +- Server Components for page data loading
    |    +- Client Components for forms, chat, uploads, and filters
    |    +- src/proxy.ts for route protection and auth redirects
    |
    +- Convex
         +- Database collections (profiles, items, reservations, chat, auth)
         +- Realtime subscriptions for chat and unread counts
         +- Storage for avatars and item photos
         +- Cron jobs for reservation expiry and message digest scheduling
         +- Generated client/server API bindings

External services
    +- Resend for verification and password reset emails
```

## Runtime Model

- Guests see a landing page at `/`.
- Signed-in users see the item feed at `/`.
- Auth state is stored in the `kk_session` HTTP-only cookie.
- `src/proxy.ts` protects non-public routes and redirects authenticated users away from auth pages.
- Data reads and writes go through Convex queries/mutations.
- File uploads go through Convex upload URLs and Convex Storage.

## Project Structure

```text
kinderkreisel/
+- convex/
|  +- auth.ts                 # Auth user + token mutations/queries
|  +- chat.ts                 # Conversations, messages, unread counts
|  +- crons.ts                # Scheduled jobs
|  +- files.ts                # Upload URL + storage helpers
|  +- items.ts                # Feed, item CRUD, reservation entry points
|  +- maintenance.ts          # Reservation expiry + digest scheduler hooks
|  +- migrations.ts           # Legacy data import/count tooling
|  +- profiles.ts             # Profile CRUD + cascade removal
|  +- reservations.ts         # Reservation lookup helpers
|  +- schema.ts               # Convex schema
|  +- _generated/             # Generated Convex API/types
+- docs/
+- src/
|  +- app/
|  |  +- (auth)/
|  |  |  +- login/page.tsx
|  |  |  +- signup/page.tsx
|  |  |  +- signup-success/page.tsx
|  |  |  +- reset-password/page.tsx
|  |  |  +- claim-account/page.tsx
|  |  |  +- auth/
|  |  |     +- confirm/route.ts
|  |  |     +- error/page.tsx
|  |  |     +- update-password/page.tsx
|  |  +- (app)/
|  |  |  +- page.tsx          # Landing page for guests, feed for signed-in users
|  |  |  +- items/
|  |  |  +- messages/
|  |  |  +- profile/
|  |  |  +- profiles/
|  |  |  +- privacy/page.tsx
|  |  |  +- impressum/page.tsx
|  |  +- api/
|  |     +- account/route.ts
|  |     +- auth/
|  |        +- claim/route.ts
|  |        +- login/route.ts
|  |        +- logout/route.ts
|  |        +- me/route.ts
|  |        +- resend-verification/route.ts
|  |        +- reset-password/
|  |        +- signup/route.ts
|  |        +- verify-email/route.ts
|  +- components/
|  |  +- convex-provider.tsx
|  |  +- item-form.tsx
|  |  +- chat-view.tsx
|  |  +- search-filter.tsx
|  |  +- avatar-upload.tsx
|  |  +- image-upload.tsx
|  |  +- ui/
|  +- lib/
|  |  +- auth/               # Session signing + server helpers
|  |  +- convex/             # Server/client Convex wrappers
|  |  +- storage/            # Convex upload helper
|  |  +- types/
|  |  +- utils.ts
|  +- proxy.ts               # Next.js proxy entry point (route protection)
+- .env.example
+- next.config.ts
+- package.json
```

## Key Flows

### Authentication

- Signup creates a profile row and auth user record in Convex.
- Email verification tokens and password reset tokens are stored in Convex collections.
- Login sets a signed JWT-based session cookie.
- Optional legacy account claiming is available behind `ENABLE_ACCOUNT_CLAIM=true`.

### Marketplace

- Feed data comes from `convex/items.ts`.
- Search and filters are URL-driven and applied in the `items:listAvailable` query.
- Item create/edit/delete flows use Convex mutations plus Convex Storage.
- Reservations are stored in Convex and auto-expire via cron.

### Messaging

- One conversation per item/buyer pair.
- Messages are stored in Convex and streamed to the UI via subscriptions.
- Unread badge and read state are computed from Convex data.

## Route Protection

Public routes:
- `/`
- `/login`
- `/signup`
- `/claim-account`
- `/reset-password`
- `/signup-success`
- `/auth/confirm`
- `/auth/error`
- `/privacy`
- `/impressum`

Auth redirect routes:
- `/login`
- `/signup`
- `/claim-account`
- `/reset-password`
- `/signup-success`

All other non-API routes require a valid session and redirect to `/login` when unauthenticated.

## Related Documents

- [TECH.md](./TECH.md)
- [DATABASE.md](./DATABASE.md)
- [PRODUCT_STATUS.md](./PRODUCT_STATUS.md)
- [SEARCH_FEATURE.md](./SEARCH_FEATURE.md)
