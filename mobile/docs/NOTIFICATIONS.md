# Push notifications & callbacks

## Overview

ARK uses `expo-notifications` for device push and an in-app pub/sub for UI updates.

## Registering (automatic)

`useNotificationSetup()` in `app/_layout.tsx` runs on app start:

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

## Simulating in dev

```tsx
import { simulateNotification } from '@/lib/notifications';

await simulateNotification({
  type: 'order_status',
  title: 'Order ORD-12345678',
  body: 'Status updated to confirmed',
  data: { orderNumber: 'ORD-12345678', orderStatus: 'confirmed' },
});
```

## CMS delivery

On order status change, Strapi sends Expo push when the user has `expoPushToken` set.

Set `PUSH_NOTIFICATIONS_DISABLED=true` in `cms/.env` to log-only mode.

## Deep links

Tapping a notification with `orderDocumentId` in data opens `/order/[id]`.
