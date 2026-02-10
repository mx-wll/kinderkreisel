# findln — Database Design

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
            │
            ├─── conversations (1:many, as buyer or seller)
            │       │
            │       └─── messages (1:many)
            │
            └─── messages (1:many, as sender)
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
| email_notifications | boolean | no | true | Opt-out toggle for reservation + message digest emails |
| last_message_email_at | timestamptz | no | now() | Tracks when last message digest email was sent; defaults to now() so existing users don't get a backlog |
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

### conversations

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | no | gen_random_uuid() | PK |
| item_id | uuid | no | — | FK → items.id, ON DELETE CASCADE |
| buyer_id | uuid | no | — | FK → profiles.id, ON DELETE CASCADE (initiator) |
| seller_id | uuid | no | — | FK → profiles.id, ON DELETE CASCADE (item owner) |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | Updated via moddatetime trigger + message insert trigger |

**Constraint**: UNIQUE(item_id, buyer_id) — one conversation per buyer per item.

### messages

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | no | gen_random_uuid() | PK |
| conversation_id | uuid | no | — | FK → conversations.id, ON DELETE CASCADE |
| sender_id | uuid | no | — | FK → profiles.id, ON DELETE CASCADE |
| content | text | no | — | Max 2000 chars (CHECK constraint) |
| read_at | timestamptz | yes | null | NULL = unread, set when recipient opens conversation |
| created_at | timestamptz | no | now() | |

**Realtime**: Added to `supabase_realtime` publication for live message delivery.

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

### conversations

| Operation | Policy |
|-----------|--------|
| SELECT | Participant only (buyer_id or seller_id = auth.uid()) |
| INSERT | Buyer only (auth.uid() = buyer_id) |
| UPDATE | Participant only (for updated_at) |
| DELETE | Not allowed via API |

### messages

| Operation | Policy |
|-----------|--------|
| SELECT | User is participant of the conversation (join to conversations) |
| INSERT | User is participant of the conversation AND sender_id = auth.uid() |
| UPDATE | Recipient only (sender_id != auth.uid()), for marking read_at |
| DELETE | Not allowed via API |

## Triggers & Functions

### on_auth_user_created

- **Event**: After INSERT on `auth.users`
- **Action**: Creates a row in `profiles` with the user's id and metadata (name, surname, etc. passed during signup)

### update_updated_at

- **Event**: Before UPDATE on `profiles`, `items`
- **Action**: Sets `updated_at = now()`

### handle_conversations_updated_at

- **Event**: Before UPDATE on `conversations`
- **Action**: Sets `updated_at = now()` via moddatetime extension

### update_conversation_updated_at

- **Event**: After INSERT on `messages`
- **Action**: Updates the parent conversation's `updated_at` to now(), so conversation list sorts by latest message

### on_reservation_send_notification

- **Event**: After INSERT on `reservations`
- **Action**: Calls Edge Function `send-notification` via `pg_net` HTTP POST — sends email to seller with buyer name and item title

### expire_reservations (Cron)

- **Mechanism**: Supabase `pg_cron` extension (available on free tier)
- **Schedule**: Runs every 15 minutes
- **Action**: Updates reservations where `expires_at < now()` AND `status = 'active'` → sets `status = 'expired'` and sets the corresponding item's `status` back to `'available'`

### send_message_digest (Cron)

- **Mechanism**: Supabase `pg_cron` + `pg_net` → Edge Function `send-message-digest`
- **Schedule**: Every 6 hours (`0 */6 * * *`)
- **Action**: Calls Edge Function that queries unread messages since each user's `last_message_email_at`, groups by conversation, sends a digest email via Resend, and updates `last_message_email_at`

### get_unread_messages_for_digest (RPC)

- **Type**: SQL function (`SECURITY DEFINER`)
- **Parameters**: `p_user_id uuid`, `p_since timestamptz`
- **Returns**: Unread messages (not sent by user, `read_at IS NULL`, `created_at > p_since`) with sender name/surname, item title, conversation ID
- **Used by**: Edge Function `send-message-digest`

## Indexes

| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| items | seller_id | btree | Fast lookup of items by seller |
| items | created_at | btree desc | Home feed sort order |
| items | status | btree | Filter available items |
| reservations | item_id, status | btree (partial: WHERE status = 'active') | Fast active reservation lookup |
| reservations | buyer_id | btree | User's reservations |
| profiles | id | btree (PK) | Already indexed |
| conversations | buyer_id | btree | User's conversations as buyer |
| conversations | seller_id | btree | User's conversations as seller |
| messages | conversation_id | btree | Messages per conversation |
