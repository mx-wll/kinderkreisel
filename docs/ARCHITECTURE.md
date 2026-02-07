# Architecture

## Overview

Kinderkreisel is a mobile-first web app built with Next.js 15 (App Router) and Supabase as the backend.

## High-Level Architecture

```
Browser (PWA)
    │
    ├── Next.js App (Vercel)
    │     ├── App Router (React 19 Server Components)
    │     ├── Server Actions (reserve, cancel reservation)
    │     ├── API Routes (account deletion)
    │     ├── shadcn/ui components
    │     └── Client-side image compression
    │
    └── Supabase
          ├── Auth (email/password, email verification)
          ├── Postgres (profiles, items, reservations, children)
          ├── Storage (avatars, item photos)
          ├── RLS (row-level security on all tables)
          └── pg_cron (reservation expiry every 15 min)
```

## Project Structure

```
kinderkreisel/
├── .claude/                     # Claude Code config
│   └── commands/                # Custom slash commands
├── docs/                        # Project documentation
├── src/
│   ├── app/
│   │   ├── (auth)/              # Auth route group (shared layout, no bottom nav)
│   │   │   ├── layout.tsx       # Centered card layout for all auth pages
│   │   │   ├── login/           # /login
│   │   │   ├── signup/          # /signup
│   │   │   ├── signup-success/  # /signup-success
│   │   │   ├── reset-password/  # /reset-password
│   │   │   └── auth/
│   │   │       ├── confirm/     # /auth/confirm (token exchange callback)
│   │   │       ├── error/       # /auth/error
│   │   │       └── update-password/ # /auth/update-password
│   │   ├── (app)/               # App route group (shared layout, bottom nav)
│   │   │   ├── layout.tsx       # App layout with BottomNav and content padding
│   │   │   ├── loading.tsx      # Home feed skeleton
│   │   │   ├── page.tsx         # Home feed (/)
│   │   │   ├── items/
│   │   │   │   ├── new/         # /items/new (create item)
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx         # Item detail
│   │   │   │       ├── loading.tsx      # Item detail skeleton
│   │   │   │       ├── not-found.tsx    # Item 404
│   │   │   │       ├── actions.ts       # Server actions (reserve, cancel)
│   │   │   │       ├── reserve-button.tsx
│   │   │   │       ├── cancel-reservation-button.tsx
│   │   │   │       ├── edit/    # /items/[id]/edit
│   │   │   │       └── delete/  # /items/[id]/delete
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx             # My profile (view/edit, items, reservations)
│   │   │   │   ├── loading.tsx          # Profile skeleton
│   │   │   │   └── profile-edit-toggle.tsx
│   │   │   ├── profiles/
│   │   │   │   ├── page.tsx             # Profiles list
│   │   │   │   └── [id]/page.tsx        # Public profile
│   │   │   ├── privacy/         # /privacy
│   │   │   └── impressum/       # /impressum
│   │   ├── api/
│   │   │   └── account/route.ts # DELETE /api/account (account deletion)
│   │   ├── layout.tsx           # Root layout (font, toaster, html lang=de)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (button, card, skeleton, etc.)
│   │   ├── login-form.tsx
│   │   ├── sign-up-form.tsx
│   │   ├── forgot-password-form.tsx
│   │   ├── update-password-form.tsx
│   │   ├── logout-button.tsx
│   │   ├── bottom-nav.tsx
│   │   ├── item-card.tsx        # Feed card (image, badge, seller, time)
│   │   ├── item-form.tsx        # Reusable create/edit form
│   │   ├── image-upload.tsx     # Image picker with compression
│   │   ├── profile-card.tsx     # Profiles list card
│   │   ├── profile-form.tsx     # Profile edit form
│   │   ├── avatar-upload.tsx    # Avatar upload/remove
│   │   ├── refresh-button.tsx   # Feed refresh
│   │   └── delete-account-button.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser Supabase client
│   │   │   ├── server.ts        # Server Supabase client (cookies)
│   │   │   └── middleware.ts    # Session refresh + route protection
│   │   ├── types/
│   │   │   └── database.ts      # TypeScript types matching DB schema
│   │   └── utils.ts             # cn(), getStorageUrl(), timeAgo(), pricingLabel(), timeRemaining(), whatsappUrl()
│   └── middleware.ts            # Next.js middleware entry point
├── CLAUDE.md
├── .env.example
└── package.json
```

## Database

See [DATABASE.md](./DATABASE.md) for full schema, RLS policies, triggers, and indexes.

## Routing

| Route | Status | Purpose |
|-------|--------|---------|
| `/` | Done | Home — item feed, newest first |
| `/login` | Done | Sign in (email/password) |
| `/signup` | Done | Sign up with custom fields |
| `/signup-success` | Done | Email confirmation prompt |
| `/reset-password` | Done | Request password reset email |
| `/auth/confirm` | Done | Token exchange callback (email verify + reset) |
| `/auth/update-password` | Done | Set new password after reset |
| `/auth/error` | Done | Auth error display |
| `/profiles` | Done | User profiles list (sorted by item count) |
| `/profiles/[id]` | Done | Other user's profile + their items |
| `/items/new` | Done | Create new item (with 20-item limit) |
| `/items/[id]` | Done | Item detail (reserve, contact, edit/delete) |
| `/items/[id]/edit` | Done | Edit item (seller only) |
| `/items/[id]/delete` | Done | Delete item confirmation (seller only) |
| `/profile` | Done | Own profile (view/edit, manage items & reservations) |
| `/privacy` | Done | Privacy policy (GDPR) |
| `/impressum` | Done | Legal notice (placeholder) |
| `/api/account` | Done | Account deletion endpoint (DELETE) |

### Route Protection (Middleware)

- **Public routes** (no auth needed): `/login`, `/signup`, `/reset-password`, `/signup-success`, `/auth/confirm`, `/auth/error`, `/privacy`, `/impressum`
- **Auth redirect** (authenticated users sent to `/`): `/login`, `/signup`, `/reset-password`, `/signup-success`
- **Protected routes** (all others): redirect to `/login` if not authenticated
