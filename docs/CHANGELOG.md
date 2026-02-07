# Changelog

All notable changes to this project will be documented in this file.

## 2026-02-07

### Added
- [feed] Home feed page — fetches available items with seller info, responsive grid (1 col mobile, 2 cols tablet)
- [feed] ItemCard component — image, pricing badge, seller avatar, time ago
- [feed] Refresh button with spinning animation via `router.refresh()`
- [items] Item detail page (`/items/[id]`) — full image, description, pricing, seller link, 4-state action area (reserve/reserved-by-me/reserved-by-other/owner)
- [items] Reserve item server action with 48h expiry, toast feedback
- [items] Cancel reservation server action (seller only), revalidates paths
- [items] Create item page (`/items/new`) — image upload, compression, form validation, 20-item limit check (server + client)
- [items] ImageUpload component — camera/gallery picker, client-side compression (800px, 200KB), preview
- [items] ItemForm component — reusable for create and edit modes
- [items] Edit item page (`/items/[id]/edit`) — pre-filled form, seller-only access guard
- [items] Delete item page (`/items/[id]/delete`) — confirmation UI, deletes DB row + storage image
- [items] Item not-found page with German copy
- [profile] My Profile page — avatar upload/remove, inline profile edit, own items list with edit/delete, incoming reservations with cancel, outgoing reservations with seller phone/WhatsApp links
- [profile] AvatarUpload component — compress + upload to Supabase Storage, remove support
- [profile] ProfileForm component — inline edit for name, surname, residency, phone
- [profile] ProfileEditToggle — view/edit mode switcher
- [profile] DeleteAccountButton — dialog confirmation, calls `/api/account` DELETE endpoint
- [profile] Account deletion API route (`/api/account`) — cleans up storage, deletes auth user via service role
- [profiles] Profiles list page (`/profiles`) — sorted by item count, ProfileCard component
- [profiles] Public profile page (`/profiles/[id]`) — avatar, name, residency, list of available items
- [legal] Privacy policy page (`/privacy`) — GDPR basics in German
- [legal] Impressum placeholder page (`/impressum`)
- [polish] Loading skeletons for home feed, profile, and item detail pages
- [utils] `getStorageUrl()`, `timeAgo()`, `pricingLabel()`, `timeRemaining()`, `whatsappUrl()` helpers
- [types] `ItemWithSellerDetail` type (includes seller phone)
- [ui] shadcn Skeleton component

### Changed
- [config] `next.config.ts` — added Supabase Storage remote image pattern
- [config] `.env.example` — added `SUPABASE_SERVICE_ROLE_KEY` for account deletion
- [tasks] Phases 6–14 marked complete in `docs/MVP_TASKS.md`

---

## 2026-02-07 (earlier)

### Added
- [infra] Next.js 15 project scaffolding with App Router and Turbopack
- [infra] Supabase client setup (browser, server, middleware) via `@supabase/ssr`
- [infra] shadcn/ui components: Button, Card, Input, Label, Checkbox, Avatar, Badge, Dialog, Dropdown Menu, Select, Separator, Textarea, Sonner
- [infra] Tailwind CSS v4 configuration with PostCSS
- [infra] ESLint configuration
- [infra] Root layout with Geist font, German `lang="de"`, Toaster
- [auth] Login page (`/login`) with email/password, German copy, friendly error messages
- [auth] Signup page (`/signup`) with custom fields: name, surname, residency, phone, readonly zip code (83623), phone consent checkbox, privacy consent checkbox
- [auth] Forgot password page (`/reset-password`) with email input and success state
- [auth] Update password page (`/auth/update-password`) with confirm password field
- [auth] Signup success page (`/signup-success`) prompting email confirmation
- [auth] Auth error page (`/auth/error`) with German error display
- [auth] Auth confirm callback route (`/auth/confirm`) for email verify + password reset token exchange
- [auth] Auth layout (`(auth)/layout.tsx`) — centered card, no bottom nav
- [auth] Middleware with route protection: unauthenticated → `/login`, authenticated on auth pages → `/`
- [auth] Logout button component with German label and icon
- [auth] User metadata passed to Supabase on signup (name, surname, residency, zip_code, phone, phone_consent)
- [docs] MVP task tracker (`docs/MVP_TASKS.md`)
- [docs] Architecture and Product Status docs

## 2026-02-06

### Added
- Project documentation structure (`docs/`)
- Product Requirements (PRD.md)
- Technical Specifications (TECH.md)
- Database Design (DATABASE.md)
- MVP Specification (MVP.md)
- V1 Specification (V1.md)
- V2 Specification (V2.md)
- Environment variables template (.env.example)
- Claude Code project config (CLAUDE.md)
- Custom slash command: `/update-docs-and-commit`
