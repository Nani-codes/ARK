import type { NotificationEvent } from '../config/notification-templates';
import { sendExpoPush } from './expo-push';
import { sendTwilioWhatsAppTemplate, type TwilioSendResult } from './twilio-whatsapp';

type StrapiLogger = {
  log: { info: (msg: string) => void; warn: (msg: string) => void };
};

export type NotifyUserOptions = {
  userId?: number;
  phone?: string;
  event: NotificationEvent;
  variables: Record<string, string>;
  push?: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  };
};

async function resolveUserContact(userId?: number, phone?: string) {
  if (userId) {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
    });
    if (user) {
      const resolvedPhone =
        phone ??
        user.phone ??
        (user.username?.startsWith('user_') ? user.username.replace('user_', '') : undefined);
      return {
        phone: resolvedPhone ? String(resolvedPhone).replace(/\D/g, '').slice(-10) : undefined,
        expoPushToken: user.expoPushToken as string | undefined,
      };
    }
  }

  if (phone) {
    return {
      phone: String(phone).replace(/\D/g, '').slice(-10),
      expoPushToken: undefined,
    };
  }

  return { phone: undefined, expoPushToken: undefined };
}

/** Fan-out WhatsApp template + optional Expo push to a user. */
export async function notifyUser(
  strapi: StrapiLogger,
  options: NotifyUserOptions
): Promise<{ whatsapp?: TwilioSendResult }> {
  const { userId, phone, event, variables, push } = options;
  const contact = await resolveUserContact(userId, phone);

  let whatsapp: TwilioSendResult | undefined;
  if (contact.phone?.length === 10) {
    whatsapp = await sendTwilioWhatsAppTemplate(strapi, event, contact.phone, variables);
  } else {
    strapi.log.warn(`[notify] no phone for event=${event} userId=${userId ?? 'n/a'}`);
  }

  if (push) {
    await sendExpoPush(strapi, contact.expoPushToken, push.title, push.body, push.data);
  }

  return { whatsapp };
}

export function formatInr(amount: number | string | undefined): string {
  const value = Number(amount ?? 0);
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatEtaIst(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
