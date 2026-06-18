import templateRegistry from './twilio-template-sids.json';

export type NotificationEvent =
  | 'otp'
  | 'order_placed'
  | 'order_confirmed'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'
  | 'quote_received'
  | 'quote_contacted'
  | 'quote_quoted'
  | 'quote_closed'
  | 'return_received'
  | 'return_approved'
  | 'return_rejected'
  | 'return_completed';

const TEMPLATE_ENV: Record<NotificationEvent, string> = {
  otp: 'TWILIO_TEMPLATE_OTP',
  order_placed: 'TWILIO_TEMPLATE_ORDER_PLACED',
  order_confirmed: 'TWILIO_TEMPLATE_ORDER_CONFIRMED',
  order_out_for_delivery: 'TWILIO_TEMPLATE_ORDER_OUT_FOR_DELIVERY',
  order_delivered: 'TWILIO_TEMPLATE_ORDER_DELIVERED',
  order_cancelled: 'TWILIO_TEMPLATE_ORDER_CANCELLED',
  quote_received: 'TWILIO_TEMPLATE_QUOTE_RECEIVED',
  quote_contacted: 'TWILIO_TEMPLATE_QUOTE_CONTACTED',
  quote_quoted: 'TWILIO_TEMPLATE_QUOTE_QUOTED',
  quote_closed: 'TWILIO_TEMPLATE_QUOTE_CLOSED',
  return_received: 'TWILIO_TEMPLATE_RETURN_RECEIVED',
  return_approved: 'TWILIO_TEMPLATE_RETURN_APPROVED',
  return_rejected: 'TWILIO_TEMPLATE_RETURN_REJECTED',
  return_completed: 'TWILIO_TEMPLATE_RETURN_COMPLETED',
};

export function getTemplateContentSid(event: NotificationEvent): string | undefined {
  const envKey = TEMPLATE_ENV[event];
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) return fromEnv;

  const fromRegistry = templateRegistry[event as keyof typeof templateRegistry]?.contentSid?.trim();
  return fromRegistry || undefined;
}

export function getTemplateMeta(event: NotificationEvent) {
  return templateRegistry[event as keyof typeof templateRegistry];
}

export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    process.env.TWILIO_WHATSAPP_FROM?.trim()
  );
}

export function areNotificationsEnabled(): boolean {
  return process.env.NOTIFICATIONS_DISABLED !== 'true';
}
