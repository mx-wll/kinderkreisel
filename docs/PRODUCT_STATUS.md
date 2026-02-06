# Product Status

## MVP

### Authentication
- [x] Email/password signup
- [x] Email verification (Supabase Auth)
- [x] Password reset flow
- [x] Zip code 83623 validation at signup
- [x] Sign in / sign out

### User Profiles
- [ ] Profile creation on signup (database trigger)
- [ ] View own profile
- [ ] Edit profile (name, surname, residency, phone, children)
- [ ] Upload / change / remove avatar
- [ ] View other user profiles

### Items
- [ ] Create item (photo, title, description, pricing)
- [ ] Client-side image compression
- [ ] Edit item
- [ ] Delete item
- [ ] 20 item limit per user
- [ ] Item detail page

### Reservation System
- [ ] Reserve button (hidden on own items)
- [ ] One reservation per item (first come, first served)
- [ ] 48h auto-expiry (pg_cron)
- [ ] Seller can cancel reservation
- [ ] Phone number revealed to buyer on reservation

### Navigation & Pages
- [x] Bottom tab bar (Home, Profiles, Add Item, My Profile)
- [ ] Home feed (items, newest first)
- [ ] Profiles list (sorted by most items)
- [ ] Add Item form
- [ ] My Profile page

### Polish
- [ ] Empty states with German CTAs
- [ ] Privacy policy page
- [ ] Account deletion (cascade all data)
- [x] Consent checkbox at signup
- [ ] Seed script (10 users, 150 items)

### Infrastructure
- [x] Next.js project setup
- [x] Supabase project connected
- [x] shadcn/ui installed
- [ ] Database schema deployed
- [ ] RLS policies applied
- [ ] Storage buckets created
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
