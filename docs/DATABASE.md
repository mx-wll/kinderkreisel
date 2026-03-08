# Database Design

Last updated: 2026-03-08

This project uses Convex as the application database. The schema lives in `convex/schema.ts`.

## Data Model Notes

- External-facing IDs are stored as strings so legacy UUID-style IDs remain stable.
- Timestamps are stored as epoch milliseconds.
- Relationships are enforced in application logic and query patterns rather than SQL foreign keys.
- Some legacy compatibility fields remain in the schema after migration from Supabase.

## Collections

### `profiles`

Represents a user profile.

| Field | Type | Notes |
|------|------|-------|
| `id` | string | Primary external profile ID |
| `name` | string | |
| `surname` | string optional | |
| `zipCode` | string optional | Required to complete onboarding |
| `phone` | string optional | |
| `addressLine1` | string optional | Street and house number |
| `addressLine2` | string optional | Address supplement |
| `avatarUrl` | string optional | Public image URL |
| `avatarStorageId` | string optional | Convex storage ID |
| `phoneConsent` | boolean | Legacy compatibility field |
| `emailNotifications` | boolean | Profile-level toggle |
| `onboardingCompletedAt` | number optional | Set when required onboarding is completed |
| `lastMessageEmailAt` | number | Reserved for digest batching |
| `createdAt` | number | |
| `updatedAt` | number | |

Indexes:
- `by_legacy_id` on `id`
- `by_createdAt` on `createdAt`

### `children`

Legacy/imported child metadata associated with a profile.

| Field | Type |
|------|------|
| `id` | string |
| `profileId` | string |
| `age` | number optional |
| `gender` | string optional |
| `createdAt` | number |

Indexes:
- `by_legacy_id`
- `by_profileId`

Note: the collection remains in the schema, but it is not a major surfaced UI feature in the current app.

### `items`

Marketplace listings.

| Field | Type | Notes |
|------|------|-------|
| `id` | string | External item ID |
| `sellerId` | string | Profile ID |
| `title` | string | |
| `description` | string | |
| `pricingType` | string | `free`, `lending`, `other` |
| `pricingDetail` | string optional | Free-text detail when `pricingType=other` |
| `category` | string | `clothing`, `shoes`, `toys`, `outdoor_sports`, `other` |
| `size` | string optional | Clothing sizes |
| `shoeSize` | string optional | Shoe sizes |
| `imageUrl` | string | Resolved public URL |
| `imageStorageId` | string optional | Convex storage ID |
| `status` | string | `available` or `reserved` |
| `createdAt` | number | |
| `updatedAt` | number | |

Indexes:
- `by_legacy_id`
- `by_sellerId`
- `by_status_createdAt`
- `by_category`

### `reservations`

Represents a temporary hold on an item.

| Field | Type | Notes |
|------|------|-------|
| `id` | string | |
| `itemId` | string | |
| `buyerId` | string | Profile ID |
| `status` | string | `active`, `expired`, `cancelled` |
| `createdAt` | number | |
| `expiresAt` | number | 48 hours after reservation |

Indexes:
- `by_legacy_id`
- `by_itemId_status`
- `by_buyerId`
- `by_status_expiresAt`

### `conversations`

Chat thread between buyer and seller for a specific item.

| Field | Type |
|------|------|
| `id` | string |
| `itemId` | string |
| `buyerId` | string |
| `sellerId` | string |
| `createdAt` | number |
| `updatedAt` | number |

Indexes:
- `by_legacy_id`
- `by_itemId_buyerId`
- `by_buyerId_updatedAt`
- `by_sellerId_updatedAt`

### `messages`

Individual chat messages.

| Field | Type | Notes |
|------|------|-------|
| `id` | string | |
| `conversationId` | string | |
| `senderId` | string | Profile ID |
| `content` | string | Max length enforced in mutation logic |
| `readAt` | number optional | |
| `createdAt` | number | |

Indexes:
- `by_legacy_id`
- `by_conversationId_createdAt`
- `by_conversationId_readAt`

### `authUsers`

App-managed auth identity records.

| Field | Type | Notes |
|------|------|-------|
| `id` | string | Auth record ID |
| `profileId` | string | Linked profile |
| `email` | string | Lowercased and unique |
| `passwordHash` | string optional | `bcryptjs` hash for password-based accounts |
| `emailVerified` | boolean | |
| `createdAt` | number | |
| `updatedAt` | number | |

Indexes:
- `by_auth_id`
- `by_profileId`
- `by_email`

### `authIdentities`

External provider identities linked to local accounts.

| Field | Type | Notes |
|------|------|-------|
| `profileId` | string | Linked profile |
| `provider` | string | e.g. `google` |
| `providerUserId` | string | Stable provider subject identifier |
| `email` | string | Lowercased provider email |
| `emailVerified` | boolean | Provider-asserted email verification |
| `createdAt` | number | |
| `updatedAt` | number | |

Indexes:
- `by_provider_providerUserId`
- `by_profileId`
- `by_email`

### `passwordResets`

One-time password reset tokens.

| Field | Type |
|------|------|
| `tokenHash` | string |
| `profileId` | string |
| `expiresAt` | number |
| `usedAt` | number optional |
| `createdAt` | number |

Indexes:
- `by_tokenHash`
- `by_profileId`

### `emailVerifications`

One-time email verification tokens.

| Field | Type |
|------|------|
| `tokenHash` | string |
| `profileId` | string |
| `expiresAt` | number |
| `usedAt` | number optional |
| `createdAt` | number |

Indexes:
- `by_tokenHash`
- `by_profileId`

## Operational Logic

### Reservation expiry

- Scheduled every 15 minutes by `convex/crons.ts`.
- Expired active reservations are marked as `expired`.
- Associated items are returned to `available`.

### Cascade-style cleanup

Delete flows are implemented in Convex mutations rather than database foreign keys:

- Deleting a profile removes children, items, reservations, conversations, messages, and stored avatar/item files.
- Deleting an item removes active reservations, conversations, messages, and its stored image.

## Historical Note

The app was migrated from Supabase to Convex. Legacy IDs and some legacy asset URLs still exist for compatibility, but the runtime database is now fully Convex-backed.
