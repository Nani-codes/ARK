import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type AppNotification = {
  type: 'order_status' | 'promo' | 'account' | 'quote';
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type NotificationListener = (notification: AppNotification) => void;

const listeners = new Set<NotificationListener>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function emit(notification: AppNotification) {
  listeners.forEach((listener) => {
    try {
      listener(notification);
    } catch (error) {
      if (__DEV__) console.warn('[notifications] listener error', error);
    }
  });
}

/** Subscribe to in-app notification events. Returns an unsubscribe function. */
export function subscribeNotifications(listener: NotificationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Dev-only: simulate a notification and fan out to subscribers. */
export async function simulateNotification(notification: AppNotification) {
  emit(notification);
  if (Platform.OS === 'web') return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data,
    },
    trigger: null,
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order updates',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  return token.data;
}

export function attachNotificationListeners(
  onResponse?: (data: Record<string, unknown>) => void
) {
  const receivedSub = Notifications.addNotificationReceivedListener((event) => {
    const content = event.request.content;
    emit({
      type: (content.data?.type as AppNotification['type']) ?? 'account',
      title: content.title ?? 'ARK',
      body: content.body ?? '',
      data: content.data as Record<string, unknown> | undefined,
    });
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((event) => {
    const data = event.notification.request.content.data as Record<string, unknown>;
    onResponse?.(data);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

/** Surface order status changes to subscribers (used after fetch/push). */
export function notifyOrderStatusChange(orderNumber: string, status: string) {
  const payload: AppNotification = {
    type: 'order_status',
    title: `Order ${orderNumber}`,
    body: `Status updated to ${status.replace(/_/g, ' ')}`,
    data: { orderNumber, orderStatus: status },
  };
  emit(payload);
}
