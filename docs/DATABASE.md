# Kinderkreisel — Database Design

## Overview

All data lives in Supabase (Postgres). Authentication is handled by Supabase Auth (`auth.users`). Application data lives in the `public` schema. Row Level Security (RLS) is enabled on all tables.

## Entity Relationship Diagram

```
auth.users (managed by Supabase)
    │
    └─── profiles (1:1)
            │
            ├─── children (1:many)
            │
            ├─── items (1:many, as seller)
            │       │
            │       └─── reservations (1:1 active)
            │
            └─── reservations (1:many, as buyer)
```

## Tables

### profiles

Created automatically via a database trigger when a new user signs up in `auth.users`.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | no | — | PK, references `auth.users.id`, ON DELETE CASCADE |
| name | text | no | — | |
| surname | text | no | — | |
| residency | text | no | — | |
| zip_code | text | no | — | Validated as '83623' at signup |
| phone | text | no | — | |
| avatar_url | text | yes | null | Path in Supabase Storage |
| phone_consent | boolean | no | false | User consented to phone sharing on reservation |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | Updated via trigger |

### children

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | no | gen_random_uuid() | PK |
| profile_id | uuid | no | — | FK → profiles.id, ON DELETE CASCADE |
| age | integer | yes | null | Age in years |
| gender | text | yes | null | e.g. 'male', 'female', 'other' |
| created_at | timestamptz | no | now() | |

### items

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | no | gen_random_uuid() | PK |
| seller_id | uuid | no | — | FK → profiles.id, ON DELETE CASCADE |
| title | text | no | — | |
| description | text | no | — | |
| pricing_type | text | no | 'free' | One of: 'free', 'lending', 'other' |
| pricing_detail | text | yes | null | Free text, only used when pricing_type = 'other' |
| image_url | text | no | — | Path in Supabase Storage |
| status | text | no | 'available' | One of: 'available', 'reserved' |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | Updated via trigger |

### reservations

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | no | gen_random_uuid() | PK |
| item_id | uuid | no | — | FK → items.id, ON DELETE CASCADE |
| buyer_id | uuid | no | — | FK → profiles.id, ON DELETE CASCADE |
| status | text | no | 'active' | One of: 'active', 'expired', 'cancelled' |
| created_at | timestamptz | no | now() | |
| expires_at | timestamptz | no | now() + 48h | |

**Constraint**: Unique on (item_id) WHERE status = 'active' — enforces one active reservation per item.

## Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| avatars | yes | Profile images. Path: `{user_id}/avatar.{ext}` |
| items | yes | Item photos. Path: `{user_id}/{item_id}.{ext}` |

Both buckets are publicly readable (images need to display without auth). Uploads are restricted to authenticated users via Storage policies.

## Row Level Security (RLS) Policies

### profiles

| Operation | Policy |
|-----------|--------|
| SELECT | Anyone authenticated can read any profile |
| INSERT | Users can only insert their own profile (id = auth.uid()) |
| UPDATE | Users can only update their own profile |
| DELETE | Users can only delete their own profile |

### children

| Operation | Policy |
|-----------|--------|
| SELECT | Anyone authenticated can read (children are shown on profiles) |
| INSERT | Users can only insert children for their own profile |
| UPDATE | Users can only update their own children |
| DELETE | Users can only delete their own children |

### items

| Operation | Policy |
|-----------|--------|
| SELECT | Anyone authenticated can read any item |
| INSERT | Users can only insert items where seller_id = auth.uid(). Enforce max 20 items via check. |
| UPDATE | Users can only update their own items |
| DELETE | Users can only delete their own items |

### reservations

| Operation | Policy |
|-----------|--------|
| SELECT | Buyer or seller of the item can read the reservation |
| INSERT | Any authenticated user can create a reservation (except on own items — enforced in app logic) |
| UPDATE | Only the seller can cancel (update status to 'cancelled') |
| DELETE | Not allowed via API |

## Triggers & Functions

### on_auth_user_created

- **Event**: After INSERT on `auth.users`
- **Action**: Creates a row in `profiles` with the user's id and metadata (name, surname, etc. passed during signup)

### update_updated_at

- **Event**: Before UPDATE on `profiles`, `items`
- **Action**: Sets `updated_at = now()`

### expire_reservations (Cron)

- **Mechanism**: Supabase `pg_cron` extension (available on free tier)
- **Schedule**: Runs every 15 minutes
- **Action**: Updates reservations where `expires_at < now()` AND `status = 'active'` → sets `status = 'expired'` and sets the corresponding item's `status` back to `'available'`

## Indexes

| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| items | seller_id | btree | Fast lookup of items by seller |
| items | created_at | btree desc | Home feed sort order |
| items | status | btree | Filter available items |
| reservations | item_id, status | btree (partial: WHERE status = 'active') | Fast active reservation lookup |
| reservations | buyer_id | btree | User's reservations |
| profiles | id | btree (PK) | Already indexed |
