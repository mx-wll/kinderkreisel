# Kinderkreisel — Technical Requirements

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Language | TypeScript | Strict mode |
| Framework | Next.js 15 (App Router) | React 19, Server Components |
| UI Components | shadcn/ui | Built on Radix UI + Tailwind CSS v4 |
| Styling | Tailwind CSS v4 | Comes with shadcn/ui |
| Backend / Database | Supabase | Postgres, Auth, Storage, Edge Functions, RLS |
| Image Compression | browser-image-compression | Client-side resize to 800px wide, ~200KB max |
| Package Manager | pnpm | |
| Deployment | Vercel (free tier) | |

## Constraints

- **Budget**: €0/month — free tiers only (Supabase free, Vercel free)
- **Maintainer**: Solo developer
- **UI Language**: German only — no i18n setup needed

## Environment Variables

See `.env.example` in the project root.

| Variable | Description | Public |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes (client-side) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes (client-side, protected by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, for account deletion) | No |
| `RESEND_API_KEY` | Resend API key (set as Supabase Edge Function secret) | No |

## Authentication

Handled entirely by Supabase Auth:
- Email/password signup with email verification
- Password reset flow
- Zip code 83623 validated at signup (self-reported, stored in user metadata)
- Profile row created automatically via database trigger on signup

## Image Handling

- 1 photo per item (required), 1 optional avatar per user
- Client-side compression via `browser-image-compression` before upload
- Target: 800px wide, ~200KB max file size
- Stored in Supabase Storage (public buckets)
- Bucket paths:
  - Avatars: `avatars/{user_id}/avatar.{ext}`
  - Items: `items/{user_id}/{item_id}.{ext}`

## Email Notifications

- **Provider**: Resend (free tier: 100 emails/day)
- **Sender**: `Kinderkreisel <onboarding@resend.dev>` (Resend test domain — upgrade to custom domain later)
- **Secret**: `RESEND_API_KEY` stored as Supabase Edge Function secret
- **Opt-out**: Users can disable via `email_notifications` toggle on profile page

### Reservation notifications (instant)

- **Trigger**: `pg_net` trigger on `reservations` table → Edge Function `send-notification`
- **Event**: New reservation → seller receives email with buyer name and item title
- **Rationale**: Time-sensitive (48h expiry), must be instant

### Message digest (batched, every 6 hours)

- **Trigger**: `pg_cron` job (`0 */6 * * *`) → `pg_net` POST → Edge Function `send-message-digest`
- **Logic**: Queries unread messages since `profiles.last_message_email_at`, groups by conversation, sends one digest email per user
- **Tracking**: `last_message_email_at` column on `profiles` updated after each digest send
- **RPC**: `get_unread_messages_for_digest(p_user_id, p_since)` — SQL function used by Edge Function

## Reservation Expiry

- Mechanism: `pg_cron` (Postgres cron, available on Supabase free tier)
- Schedule: Every 15 minutes
- Action: Marks expired reservations (`expires_at < now()`) and resets item status to `available`

## Deployment

- Vercel free tier, connected to the GitHub repo
- Automatic deployments on push to `main`
- Preview deployments on pull requests

## Related Documents

- [Product Requirements](./PRD.md)
- [Database Design](./DATABASE.md)
