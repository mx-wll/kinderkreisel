# Architecture

## Overview

Kinderkreisel is a mobile-first web app built with Next.js 15 (App Router) and Supabase as the backend.

## High-Level Architecture

```
Browser (PWA)
    │
    ├── Next.js App (Vercel)
    │     ├── App Router (React 19 Server Components)
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
│   │   ├── layout.tsx           # Root layout (font, toaster, html lang=de)
│   │   ├── page.tsx             # Home page (/)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── login-form.tsx
│   │   ├── sign-up-form.tsx
│   │   ├── forgot-password-form.tsx
│   │   ├── update-password-form.tsx
│   │   └── logout-button.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser Supabase client
│   │   │   ├── server.ts        # Server Supabase client (cookies)
│   │   │   └── middleware.ts    # Session refresh + route protection
│   │   ├── types/
│   │   │   └── database.ts      # Supabase generated types
│   │   └── utils.ts             # cn() helper
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
| `/` | Placeholder | Home — item feed, newest first |
| `/login` | Done | Sign in (email/password) |
| `/signup` | Done | Sign up with custom fields |
| `/signup-success` | Done | Email confirmation prompt |
| `/reset-password` | Done | Request password reset email |
| `/auth/confirm` | Done | Token exchange callback (email verify + reset) |
| `/auth/update-password` | Done | Set new password after reset |
| `/auth/error` | Done | Auth error display |
| `/profiles` | Planned | User profiles list |
| `/profiles/[id]` | Planned | Other user's profile + their items |
| `/items/new` | Planned | Create new item |
| `/items/[id]` | Planned | Item detail page |
| `/items/[id]/edit` | Planned | Edit item |
| `/profile` | Planned | Own profile (view/edit, manage items & reservations) |
| `/privacy` | Planned | Privacy policy |
| `/impressum` | Planned | Legal notice |

### Route Protection (Middleware)

- **Public routes** (no auth needed): `/login`, `/signup`, `/reset-password`, `/signup-success`, `/auth/confirm`, `/auth/error`, `/privacy`, `/impressum`
- **Auth redirect** (authenticated users sent to `/`): `/login`, `/signup`, `/reset-password`, `/signup-success`
- **Protected routes** (all others): redirect to `/login` if not authenticated
