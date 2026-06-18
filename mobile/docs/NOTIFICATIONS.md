# Notifications

ARK delivers transactional updates through **Twilio WhatsApp** (primary) and **Expo push** (in-app).

## Channels

| Channel | Where | Events |
|---------|-------|--------|
| WhatsApp | Server-side via Twilio templates | OTP, order placed/status, quotes, returns |
| Expo push | [`mobile/hooks/useNotifications.ts`](../hooks/useNotifications.ts) | Order status (when device token registered) |

## WhatsApp (server)

Configured in `cms/.env` — see [`cms/.env.example`](../../cms/.env.example) and [`cms/docs/WHATSAPP-TEMPLATES.md`](../../cms/docs/WHATSAPP-TEMPLATES.md).

Template bodies and ContentSid registry: `cms/src/config/twilio-template-sids.json`

Events are sent from Strapi lifecycles:

- **OTP** — `phone-auth/send-otp`
- **Orders** — `order` afterCreate (placed) + afterUpdate (confirmed, out for delivery, delivered, cancelled)
- **Quotes** — `quote-request` afterCreate + afterUpdate
- **Returns** — `return-request` afterCreate + afterUpdate

Without Twilio credentials, CMS logs `[mock-whatsapp]` and OTP accepts any 6 digits in dev.

## In-app push (development builds only)

Expo Go does **not** support remote push (SDK 53+). In-app push requires an EAS dev or production build.

`useNotificationSetup()` in `app/_layout.tsx` runs on app start when supported:

1. Requests notification permission
2. Gets Expo push token
3. Saves token to CMS (`PUT /api/user-profile/push-token`) when logged in
4. Listens for foreground notifications

## Subscribing in a screen

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function OrdersScreen() {
  useNotifications((n) => {
    if (n.type === 'order_status') {
      // refetch orders, show toast, etc.
    }
  });
}
```

## Simulating in dev (in-app only)

```tsx
import { simulateNotification } from '@/lib/notifications';

await simulateNotification({
  type: 'order_status',
  title: 'Order ORD-12345678',
  body: 'Status updated to confirmed',
  data: { orderNumber: 'ORD-12345678', orderStatus: 'confirmed' },
});
```

## Kill switches

In `cms/.env`:

- `NOTIFICATIONS_DISABLED=true` — skip all WhatsApp sends (log only)
- `PUSH_NOTIFICATIONS_DISABLED=true` — skip Expo push API calls

## Deep links

Tapping an Expo notification with `orderDocumentId` in data opens `/order/[id]`.
