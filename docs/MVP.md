# findln — MVP Specification

Last updated: 2026-03-08

## Goal

Deliver a simple local marketplace for children's items where families can sign up, browse nearby listings, reserve items, and coordinate pickup directly.

## MVP Scope

### Authentication
- Email/password signup and login
- Google login
- Email verification
- Password reset
- Session-based route protection

### Profiles
- Basic profile created at signup
- Onboarding with mandatory ZIP code and optional phone/address
- Editable name, surname, ZIP code, phone number, and address
- Avatar upload
- Public profile pages

### Items
- Create, edit, delete item listings
- One required photo per item
- Pricing modes: free, lending, other
- Mobile-friendly feed and detail views
- Search and filter on the home feed

### Reservations
- Reserve available items
- 48-hour expiry window
- Seller/buyer cancellation
- Seller contact reveal after reservation

### Messaging
- One conversation per buyer/item pair
- Realtime in-app chat
- Unread counts

### Legal / Ops
- Privacy page
- Impressum page
- Account deletion

## Non-Goals for MVP

- Payments
- Shipping
- Multi-language support
- Additional social login providers beyond Google
- Advanced search relevance features

## Implementation Note

The current MVP runtime uses Next.js + Convex with app-managed authentication. Earlier Supabase-era planning documents in this folder are historical references.
