# findln

Mobile-first local marketplace for children's items in and around zip code `83623`.

## Current Stack

- Next.js 16
- React 19
- Convex for database, realtime, storage, and cron jobs
- Custom auth via Next.js route handlers + signed JWT cookie
- Resend for verification and password reset emails
- Tailwind CSS v4 + shadcn/ui

## Current Product Scope

- Email/password signup and login
- Email verification and password reset
- Optional legacy account claim flow
- Item feed with search and filters
- Item create/edit/delete
- Reservations with 48-hour expiry
- In-app chat with unread badge
- Profile editing, avatar upload, and account deletion

## Project Structure

- `src/app` — App Router pages, layouts, and route handlers
- `src/components` — UI and feature components
- `src/lib` — auth, Convex, storage, shared utilities
- `src/proxy.ts` — route protection and auth redirects
- `convex` — schema, queries, mutations, cron jobs
- `docs` — architecture, tech, database, product, and historical planning docs

## Environment Variables

Copy `.env.example` into your local env setup and provide values for:

- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `AUTH_SECRET`
- `ENABLE_ACCOUNT_CLAIM`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Notes:
- In production, `RESEND_API_KEY` should be configured so signup verification works.
- In non-production, signup auto-verifies when Resend is not configured.

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

Run lint:

```bash
pnpm lint
```

Run a production build:

```bash
pnpm build
```

Run Convex locally / against the linked deployment:

```bash
pnpm convex:dev
```

Deploy Convex functions/schema:

```bash
pnpm convex:deploy
```

## Authentication Model

- Session cookie name: `kk_session`
- Session signing: `jose`
- Password hashing: `bcryptjs`
- Public routes and redirects are enforced in `src/proxy.ts`

## Storage Model

- New uploads go to Convex Storage
- `next.config.ts` still allows legacy Supabase public storage URLs for migrated assets

## Background Jobs

Configured in `convex/crons.ts`:

- Reservation expiry every 15 minutes
- Message digest schedule every 6 hours

Current status:
- Reservation expiry is implemented
- Message digest send logic is still a placeholder

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Technical Requirements](./docs/TECH.md)
- [Database Design](./docs/DATABASE.md)
- [Product Status](./docs/PRODUCT_STATUS.md)
- [Search Feature](./docs/SEARCH_FEATURE.md)
- [MVP Spec](./docs/MVP.md)

## Historical Notes

Some documents in `docs/` are intentionally preserved as migration/build history from the Supabase-to-Convex transition. They are marked as historical where applicable.
