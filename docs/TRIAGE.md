# ARK — Issue triage & backlog

This document tracks open work, priorities, and ownership. Use it with GitHub issues and `.github/ISSUE_TEMPLATE/`.

## Status (June 2026)

| Area | Shipped | Notes |
|------|---------|-------|
| Commerce UX | ✅ | Variants, buy-now, inline cart, delivery selector |
| Payments | ✅ | Razorpay native + WebView fallback |
| Bulk quotes | ✅ | Product-linked form, GSTIN, preferred date |
| Tier pricing | ✅ | Quantity breaks on product/variant |
| Notifications | ✅ | Expo push + in-app callback hook |
| Delivery ETA | ✅ | Slot-based preview on checkout & PDP |
| Brand / CTAs | ✅ | Logo component, PrimaryButton variants |

## Priority matrix

| Priority | Definition | Examples |
|----------|------------|----------|
| P0 | Blocks orders or payments | Razorpay down, checkout crash |
| P1 | Core revenue / retention | Bulk quotes, tier pricing, push on status |
| P2 | UX polish | CTA consistency, logo guidelines |
| P3 | Nice-to-have | Extra carousel slots, analytics |

## Labels (recommended)

- `mobile` — Expo app
- `cms` — Strapi backend
- `ops` — Manual fulfillment, content
- `design` — Brand, UI system
- `bug` / `enhancement`

## Definition of done

1. Code merged to `main`
2. CMS schema changes documented in `cms/CONTENT-EDITING.md`
3. Mobile typecheck passes (`cd mobile && npx tsc --noEmit`)
4. Manual smoke test on affected flow
5. GitHub issue closed with commit reference

## Remaining backlog (post–June 2026 ship)

- Real FCM/APNs production credentials for EAS builds
- Admin UI to reply to bulk quotes with `quotedPrice`
- Per-variant stock counts
- Analytics / crash reporting

## Related docs

- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [cms/CONTENT-EDITING.md](../cms/CONTENT-EDITING.md)
- [mobile/docs/NOTIFICATIONS.md](../mobile/docs/NOTIFICATIONS.md)
- [docs/BRAND.md](./BRAND.md)
- [mobile/docs/CTA-GUIDELINES.md](../mobile/docs/CTA-GUIDELINES.md)
