type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
};

/** Send a push notification via Expo Push API. No-ops when token missing or in stub mode. */
export async function sendExpoPush(
  strapi: { log: { info: (msg: string) => void; warn: (msg: string) => void } },
  expoPushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  if (!expoPushToken) {
    strapi.log.info(`[push] skipped (no token): ${title}`);
    return;
  }

  if (process.env.PUSH_NOTIFICATIONS_DISABLED === 'true') {
    strapi.log.info(`[push stub] ${title}: ${body}`);
    return;
  }

  const message: ExpoPushMessage = {
    to: expoPushToken,
    title,
    body,
    data,
    sound: 'default',
  };

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      strapi.log.warn(`Expo push failed: ${await res.text()}`);
    }
  } catch (error) {
    strapi.log.warn(`Expo push error: ${String(error)}`);
  }
}
