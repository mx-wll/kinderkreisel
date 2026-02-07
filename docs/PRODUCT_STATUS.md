# Product Status

## MVP

### Authentication
- [x] Email/password signup
- [x] Email verification (Supabase Auth)
- [x] Password reset flow
- [x] Zip code 83623 validation at signup
- [x] Sign in / sign out

### User Profiles
- [x] Profile creation on signup (database trigger)
- [x] View own profile
- [x] Edit profile (name, surname, residency, phone, children)
- [x] Upload / change / remove avatar
- [x] View other user profiles

### Items
- [x] Create item (photo, title, description, pricing)
- [x] Client-side image compression
- [x] Edit item
- [x] Delete item
- [x] 20 item limit per user
- [x] Item detail page

### Reservation System
- [x] Reserve button (hidden on own items)
- [x] One reservation per item (first come, first served)
- [x] 48h auto-expiry (pg_cron)
- [x] Seller can cancel reservation
- [x] Phone number revealed to buyer on reservation

### Navigation & Pages
- [x] Bottom tab bar (Home, Profiles, Add Item, My Profile)
- [x] Home feed (items, newest first)
- [x] Profiles list (sorted by most items)
- [x] Add Item form
- [x] My Profile page

### Polish
- [x] Empty states with German CTAs
- [x] Privacy policy page
- [x] Account deletion (cascade all data)
- [x] Consent checkbox at signup
- [x] Seed script (10 users, 150 items)

### Infrastructure
- [x] Next.js project setup
- [x] Supabase project connected
- [x] shadcn/ui installed
- [x] Database schema deployed
- [x] RLS policies applied
- [x] Storage buckets created
- [ ] Vercel deployment

---

## V1

- [ ] Google social login
- [ ] Apple social login
- [ ] In-app chat (per item)
- [ ] Item browsing page with search
- [ ] Filter by type, monetization, child age
- [ ] Email notifications for reservations

---

## V2

- [ ] Image guidance for sellers
- [ ] AI-generated descriptions
- [ ] Sophisticated category model
- [ ] User onboarding / seller guidelines
- [ ] Impressum page
