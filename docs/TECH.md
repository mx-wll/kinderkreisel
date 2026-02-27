# findln — Technical Requirements

Last updated: 2026-02-27

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Language | TypeScript | Strict mode |
| Framework | Next.js 16 | App Router, Server Components, route handlers |
| UI | React 19 + shadcn/ui | Radix-based primitives |
| Styling | Tailwind CSS v4 | Global CSS + utility classes |
| Backend | Convex | Database, realtime, storage, cron jobs |
| Authentication | Custom auth on Next.js + JWT cookie | `jose` + `bcryptjs` |
| Email | Resend | Verification and password reset |
| Image Compression | `browser-image-compression` | Client-side before upload |
| Package Manager | pnpm | |
| Deployment | Vercel | Preview + production capable |

## Environment Variables

See `.env.example` for the canonical template.

| Variable | Description | Public |
|----------|-------------|--------|
| `CONVEX_DEPLOYMENT` | Convex deployment identifier | No |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL | Yes |
| `AUTH_SECRET` | Signing secret for the session JWT | No |
| `ENABLE_ACCOUNT_CLAIM` | Enables legacy profile claiming flow | No |
| `RESEND_API_KEY` | Resend API key | No |
| `RESEND_FROM_EMAIL` | Sender identity for Resend emails | No |

## Authentication

- Email/password signup and login are handled by app route handlers under `/api/auth/*`.
- Passwords are hashed with `bcryptjs`.
- Sessions are signed with `jose` and stored in the `kk_session` HTTP-only cookie.
- Session lifetime is 30 days.
- Email verification is required in production when Resend is configured.
- In non-production environments without Resend configured, signup auto-verifies accounts.
- Password reset uses one-time tokens stored in Convex.
- Legacy account claim exists for imported profiles and is gated by `ENABLE_ACCOUNT_CLAIM`.

## Data + Storage

- Application records live in Convex collections.
- User-uploaded images are stored in Convex Storage.
- `next.config.ts` allows remote images from:
  - Convex storage URLs (`**.convex.cloud/api/storage/**`)
  - Legacy Supabase public storage URLs still referenced by migrated data

## Search + Filtering

- Search is implemented as case-insensitive substring matching on item title and description.
- Filters are driven by URL search params: `q`, `category`, `size`, `shoe_size`, `pricing`.
- The feed query is currently implemented in `convex/items.ts` (`listAvailable`).

## Background Jobs

Configured in `convex/crons.ts`:

- Reservation expiry every 15 minutes via `maintenance.expireReservations`
- Message digest schedule every 6 hours via `maintenance.sendMessageDigest`

Current status:
- Reservation expiry is implemented.
- Message digest scheduling exists, but the send logic is still a placeholder.

## Deployment Notes

- Production build is `next build`.
- Convex deployment is handled with `pnpm convex:deploy`.
- The app currently builds cleanly with Next.js 16.1.6.

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [SEARCH_FEATURE.md](./SEARCH_FEATURE.md)
