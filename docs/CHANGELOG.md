# Changelog

All notable changes to this project will be documented in this file.

## 2026-02-07

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
