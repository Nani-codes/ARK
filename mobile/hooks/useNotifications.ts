import { useEffect, useState } from 'react';
import { router } from 'expo-router';

import { savePushToken } from '@/lib/api';
import {
  attachNotificationListeners,
  registerForPushNotifications,
  simulateNotification,
  subscribeNotifications,
  type AppNotification,
} from '@/lib/notifications';
import { useAuthStore } from '@/stores/auth';

/**
 * Subscribe to in-app notification callbacks from any screen.
 *
 * @example
 * useNotifications((n) => toast.show(n.title));
 */
export function useNotifications(onNotification?: (notification: AppNotification) => void) {
  const [lastNotification, setLastNotification] = useState<AppNotification | null>(null);

  useEffect(() => {
    if (!onNotification) return;
    return subscribeNotifications((notification) => {
      setLastNotification(notification);
      onNotification(notification);
    });
  }, [onNotification]);

  return { lastNotification, simulateNotification };
}

/** Root-level setup: permissions, token sync, foreground listeners. */
export function useNotificationSetup() {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    let detach = () => {};

    const setup = async () => {
      const pushToken = await registerForPushNotifications();
      if (pushToken && token) {
        try {
          await savePushToken(pushToken);
        } catch (error) {
          if (__DEV__) console.warn('[notifications] token sync failed', error);
        }
      }

      detach = await attachNotificationListeners((data) => {
        if (data?.type === 'order_status' && data.orderDocumentId) {
          router.push(`/order/${data.orderDocumentId}`);
        }
      });
    };

    void setup();
    return () => detach();
  }, [isHydrated, token]);
}
