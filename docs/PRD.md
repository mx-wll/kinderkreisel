# findln — Product Requirements

## Vision

A local community marketplace where people can give away or cheaply sell children's items they no longer need. Think eBay Kleinanzeigen but stripped down to the essentials — no shipping, no payment processing, just neighbors helping neighbors.

## Target Audience

Families in and around zip code 83623, Germany.

## Core Problem

Parents accumulate children's clothing and sports equipment that their kids outgrow. There's no simple, local way to pass these items on to other families in the community without the overhead of traditional marketplace apps.

## Product Principles

- **Simple over feature-rich**: Every feature must earn its place. When in doubt, leave it out.
- **Local only**: No shipping, no payment processing. Pickup is arranged via phone/WhatsApp.
- **Trust-based**: Small community, self-reported zip code, optional phone sharing after reservation.
- **Mobile-first**: Most users will browse and post from their phones.

## Item Types

- Children's clothing (all ages)
- Sports accessories (ski, football, ice hockey, etc.)
- Other children's items

## Pricing Model

Sellers choose one of three options per item:
- **Kostenlos (Free)**: Pre-selected default. Item is given away.
- **Leihen (Lending)**: Item is lent, not given away permanently.
- **Andere (Other)**: Free text field (e.g. "€5", "Verhandlungsbasis", "Tauschen gegen...")

## User Flow Summary

1. Sign up with name, email, password, or continue with Google
2. Complete onboarding with zip code, optionally phone number and address
3. Browse items on Home feed or browse user profiles
4. Tap an item to see details
5. Reserve an item → get seller's phone number if available or use chat to arrange pickup
6. Post your own items with a photo, title, description, and pricing

## Milestones

- **MVP**: Core marketplace — auth, profiles, items, reservations, discovery. See [docs/MVP.md](./MVP.md)
- **V1**: Social login, in-app chat, item browsing with filters. See [docs/V1.md](./V1.md)
- **V2**: AI features and advanced categories. See [docs/V2.md](./V2.md)

## Related Documents

- [Technical Requirements](./TECH.md)
- [Database Design](./DATABASE.md)
- [MVP Specification](./MVP.md)
- [V1 Specification](./V1.md)
- [V2 Specification](./V2.md)
