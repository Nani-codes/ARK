# ARK Procurement System

Construction materials quick-commerce MVP — **Expo React Native** customer app + **Strapi CMS** backend.

## Project structure

```
ARK/
├── cms/      # Strapi 5 (SQLite) — catalog, orders, quotes, users
├── mobile/   # Expo app — customer ordering flow
└── README.md
```

## Prerequisites

- Node.js 20+
- npm
- iOS Simulator, Android Emulator, or Expo Go on a physical device

## 1. Start Strapi (CMS)

```bash
cd cms
npm install
npm run develop
```

- Admin panel: http://localhost:1337/admin (create admin on first run)
- API: http://localhost:1337/api

On first boot, the CMS seeds **18 categories** (aligned with [HomeRun](https://home-run.co/) departments) and **14 products** (all with size/pack variants where applicable), and configures API permissions.

Category thumbnails are **bundled locally** in `mobile/assets/categories/` (not loaded from the network at runtime). To refresh seed data after category changes, delete `cms/.tmp/data.db` and restart Strapi.

### Product detail (HomeRun-style)

- **% OFF** badge from `compareAtPrice` vs sale price  
- **Regular / Sale price** display  
- **Size / pack variants** — repeatable **Size / pack option** components in Strapi (no JSON)  
- **Specifications** — repeatable **Specification** rows (Label + Value)  
- **7 Day Replacement** trust chip (`replacementDays`)  
- **Bulk pricing** CTA (`bulkPricingEnabled` → quote screen)  
- Sticky bottom bar: **− / qty / +** and **ADD**

**Content editors:** see [cms/CONTENT-EDITING.md](cms/CONTENT-EDITING.md) for how to add sizes and specs in the admin UI.

### Mock phone auth

| Endpoint | Body | Notes |
|----------|------|-------|
| `POST /api/phone-auth/send-otp` | `{ "phone": "9876543210" }` | Always succeeds (no SMS) |
| `POST /api/phone-auth/verify` | `{ "phone": "...", "otp": "123456" }` | Any 6-digit OTP works |

## 2. Start mobile app

```bash
cd mobile
npm install
cp .env.example .env   # adjust STRAPI_URL if needed
npx expo start
```

### Strapi URL by environment

**Expo Go on a real phone cannot use `localhost`** — that points at the phone, not your Mac. Use your Mac’s Wi‑Fi IP:

```bash
ipconfig getifaddr en0
# e.g. 192.168.1.4 → set in mobile/.env:
# EXPO_PUBLIC_STRAPI_URL=http://192.168.1.4:1337
```

Then **restart Expo** (`npx expo start` again) so the env var reloads.

| Environment | `EXPO_PUBLIC_STRAPI_URL` |
|-------------|--------------------------|
| **Physical device / Expo Go** | `http://<your-lan-ip>:1337` (e.g. `http://192.168.1.4:1337`) |
| iOS Simulator | `http://localhost:1337` |
| Android Emulator | `http://10.0.2.2:1337` |

Phone and Mac must be on the **same Wi‑Fi**. Strapi is already bound to `0.0.0.0:1337` so LAN access works.

## MVP features

### Customer app (`mobile/`)

- Phone OTP login (mock)
- Home: search, categories, featured products
- Category product listing
- Product detail + cart
- Checkout (NEFT / COD) → order success
- Order history
- Bulk quote request
- Profile + logout

### Back office (Strapi Admin)

- Product & category CRUD
- Order status updates (`pending` → `confirmed` → `out_for_delivery` → `delivered`)
- Quote request inbox
- Users list

## API overview

- `GET /api/categories?sort=sortOrder:asc`
- `GET /api/products?populate=image&populate=category`
- `GET /api/products/:documentId?populate=image&populate=category`
- `POST /api/orders` (authenticated)
- `GET /api/orders` (authenticated, own orders only)
- `POST /api/quote-requests` (authenticated)

## Operations model

Manual fulfillment behind the scenes: team updates orders in Strapi Admin and contacts bulk quote leads by phone. No separate Postgres or NestJS service — **Strapi SQLite is the single data store** for MVP.
