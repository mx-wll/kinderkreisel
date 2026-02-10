# findln

Local community marketplace for giving away and finding secondhand children's items (clothing, sports equipment) in zip code 83623, Germany.

## Tech Stack

- **Language**: TypeScript (strict)
- **Framework**: Next.js 15 (App Router, React 19)
- **UI**: shadcn/ui (Radix UI + Tailwind CSS v4)
- **Backend**: Supabase (Postgres, Auth, Storage, RLS)
- **Image Compression**: browser-image-compression (client-side)
- **Package Manager**: pnpm
- **Deployment**: Vercel free tier
- **UI Language**: German only

## Documentation

All project docs live in `docs/`. Read these before making changes:

| Doc | What's in it |
|-----|-------------|
| [PRD.md](./docs/PRD.md) | Target audience, core problem, product principles, pricing model, user flows |
| [TECH.md](./docs/TECH.md) | Full tech stack, env vars, image handling, deployment |
| [DATABASE.md](./docs/DATABASE.md) | Tables, columns, RLS policies, triggers, indexes, storage buckets |
| [MVP.md](./docs/MVP.md) | MVP feature spec: auth, profiles, items, reservations, navigation |
| [V1.md](./docs/V1.md) | V1 spec: social login, chat, search/filters, notifications |
| [V2.md](./docs/V2.md) | V2 spec: AI features, categories, onboarding |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System diagram, project structure, routing table |
| [PRODUCT_STATUS.md](./docs/PRODUCT_STATUS.md) | Feature checklist with completion status per milestone |
| [CHANGELOG.md](./docs/CHANGELOG.md) | Running log of changes, grouped by date and type |

**Keeping docs current:**
- Update docs after major milestones and structural changes
- Use `/update-docs-and-commit` slash command when committing

## Project Structure

```
findln/
├── .claude/
│   └── commands/
│       └── update-docs-and-commit.md
├── .env.example
├── CLAUDE.md
├── Kinderkreisel.md
└── docs/
    ├── PRD.md
    ├── TECH.md
    ├── DATABASE.md
    ├── MVP.md
    ├── V1.md
    ├── V2.md
    ├── ARCHITECTURE.md
    ├── PRODUCT_STATUS.md
    └── CHANGELOG.md
```

## Key Concepts

- **Users** sign up with email/password, restricted to zip code 83623
- **Items** have 1 required photo, title, description, and pricing (free/lending/other)
- **Reservations** are first-come-first-served, 1 per item, expire after 48h
- Phone number shared with buyer on reservation (with consent)
- No shipping, no payment processing — pickup arranged via phone/WhatsApp

## Research First

- Before implementing a new feature or when unsure about technical details, look up the latest docs for the relevant technology via Context7 MCP
- This applies to all stack technologies: Next.js, Supabase, shadcn/ui, Tailwind CSS, React, etc.

## Conventions

- Code and documentation in English
- UI copy in German
- All database tables use RLS — never bypass with service role key in client code

## Component patterns:
- Use Shadcn UI for all interactive elements (inputs, cards, buttons...)
- keep components focused and small

## constraints & Policies

**Dependencies:**
- prefer Shadcn components over adding new UI libraries
- minimize external dependencies for MVP

## Repository Etiquette:

**Branching** 
- always create a branche when working on new features
- never commit directly to main

## Copy tone: 
- casual, friendly and a bit witty
- conversational labels and instructions
- helpfull error messages that suggest next steps