# Kinderkreisel — MVP Specification

The MVP delivers a functional marketplace where users can sign up, post items, browse, and reserve items for pickup.

## Authentication

- Users sign up with email and password
- Email verification at signup (via Supabase Auth)
- Password reset flow (via Supabase Auth)
- Users can only sign up with zip code 83623 (self-reported at signup)
- Users can sign in and sign out

## User Profiles

- Name
- Surname
- Residency
- Phone number
- Profile image (optional)
  - Users can upload, change, and remove their profile image
- Children (optional)
  - Age (optional)
  - Gender (optional)
- All fields except email are editable after signup

## Items

- Users can upload items
  - 1 photo per item (required, compressed client-side before upload)
  - Title and description
  - Pricing: free (pre-selected), lending, or other (free text field)
- Users can edit their items (title, description, price, photo)
- Users can delete their items
- Maximum 20 items per user
- Items are gone immediately when deleted (no "mark as gone" state)

## Reservation System

- Users can reserve an item by hitting a "Reservieren" button
- Reserve button is hidden on the user's own items
- Only one reservation per item at a time (first come, first served)
- Reservations expire automatically after 48 hours
- Sellers can manually cancel a reservation
- When reserved, the buyer sees the seller's phone number to arrange pickup via phone or WhatsApp
- Phone number sharing requires explicit consent (shown at signup)

## Navigation & Pages

Bottom tab bar with 4 tabs:

| Tab | Page | Description |
|-----|------|-------------|
| Home | `/` | Feed of all available items, sorted newest first |
| Profiles | `/profiles` | List of user profiles, sorted by most items listed |
| Add Item | `/items/new` | Form to create a new item listing |
| My Profile | `/profile` | View/edit own profile, manage own items and reservations |

Additional pages (not in tab bar):
- `/login` — Sign in page
- `/signup` — Sign up page
- `/reset-password` — Password reset
- `/profiles/[id]` — Other user's profile with their items
- `/items/[id]` — Item detail page
- `/items/[id]/edit` — Edit item page
- `/privacy` — Privacy policy
- `/impressum` — Legal notice (to be added before launch)

After login, user lands on Home (`/`).

## Discovery

- Users browse the Home feed for items (no search or filters in MVP)
- Users can browse profiles on the Profiles tab
- Tapping a profile shows that user's listed items

## Empty States

Friendly German message with call to action for every empty view:
- No items on Home: "Noch keine Artikel vorhanden."
- User has no items: "Du hast noch keine Artikel. Jetzt etwas einstellen!" (with button)
- No profiles: "Noch keine Nutzer registriert."
- No reservations: "Keine aktiven Reservierungen."

## Notifications

No notifications in MVP — users check the app manually.

## Seed Data

- 10 dummy users, each with 15 items
- Created via a seed script with stock photos and German-language content

## Privacy & Legal (GDPR)

- Privacy policy page
- Users can delete their account and all associated data (items, reservations, profile)
- Consent checkbox at signup
- Impressum page (to be added before launch)
