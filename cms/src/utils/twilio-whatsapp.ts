import {
  areNotificationsEnabled,
  getTemplateContentSid,
  isTwilioConfigured,
  type NotificationEvent,
} from '../config/notification-templates';

export type TwilioSendResult = {
  ok: boolean;
  sid?: string;
  error?: string;
  errorCode?: number;
  status?: string;
  stub?: boolean;
  deliveryFailed?: boolean;
};

/** Normalize a 10-digit Indian mobile to whatsapp:+91XXXXXXXXXX */
export function toWhatsAppAddress(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    throw new Error(`Invalid phone number: ${phone}`);
  }
  return `whatsapp:+91${digits}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return digits.length >= 4 ? `****${digits.slice(-4)}` : '****';
}

async function fetchMessageStatus(messageSid: string): Promise<{
  status?: string;
  error_code?: number;
  error_message?: string;
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}.json`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  if (!res.ok) return {};
  return (await res.json()) as {
    status?: string;
    error_code?: number;
    error_message?: string;
  };
}

/** Poll once after send — Twilio may accept then fail async (e.g. sandbox 63015). */
async function confirmDelivery(messageSid: string) {
  await new Promise((r) => setTimeout(r, 2000));
  return fetchMessageStatus(messageSid);
}

/**
 * Send a Twilio WhatsApp template message.
 * Uses ContentSid + ContentVariables (numbered keys as strings).
 */
export async function sendTwilioWhatsAppTemplate(
  strapi: { log: { info: (msg: string) => void; warn: (msg: string) => void } },
  event: NotificationEvent,
  phone: string,
  variables: Record<string, string>
): Promise<TwilioSendResult> {
  if (!areNotificationsEnabled()) {
    strapi.log.info(`[notifications disabled] ${event} → ${maskPhone(phone)}`);
    return { ok: true, stub: true };
  }

  const contentSid = getTemplateContentSid(event);
  if (!isTwilioConfigured() || !contentSid) {
    strapi.log.info(
      `[mock-whatsapp] ${event} → +91${maskPhone(phone)} vars=${JSON.stringify(variables)}`
    );
    return { ok: true, stub: true };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
  const from = process.env.TWILIO_WHATSAPP_FROM!.trim();

  const body = new URLSearchParams();
  body.set('To', toWhatsAppAddress(phone));
  body.set('From', from);
  body.set('ContentSid', contentSid);
  body.set('ContentVariables', JSON.stringify(variables));

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    const json = (await res.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
      error_message?: string;
    };

    if (!res.ok) {
      const error = json.message ?? json.error_message ?? `HTTP ${res.status}`;
      strapi.log.warn(`Twilio WhatsApp failed (${event}): ${error}`);
      return { ok: false, error };
    }

    const delivery = json.sid ? await confirmDelivery(json.sid) : {};
    const failedStatuses = new Set(['failed', 'undelivered']);
    const deliveryFailed = delivery.status ? failedStatuses.has(delivery.status) : false;

    if (deliveryFailed) {
      const code = delivery.error_code;
      const hint =
        code === 63015
          ? 'Recipient must join Twilio WhatsApp sandbox (WhatsApp "join <code>" to +1 415 523 8886)'
          : delivery.error_message ?? 'Delivery failed';
      strapi.log.warn(
        `Twilio WhatsApp delivery failed (${event}) sid=${json.sid} code=${code ?? 'n/a'}: ${hint}`
      );
      return {
        ok: false,
        sid: json.sid,
        error: hint,
        errorCode: code,
        status: delivery.status,
        deliveryFailed: true,
      };
    }

    strapi.log.info(
      `Twilio WhatsApp sent (${event}) sid=${json.sid} status=${delivery.status ?? 'queued'} to=${maskPhone(phone)}`
    );
    return { ok: true, sid: json.sid, status: delivery.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    strapi.log.warn(`Twilio WhatsApp error (${event}): ${message}`);
    return { ok: false, error: message };
  }
}
