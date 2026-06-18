import type { NotificationEvent } from '../config/notification-templates';

export type WhatsAppTemplateCategory = 'AUTHENTICATION' | 'UTILITY' | 'MARKETING';

export type WhatsAppTemplateDefinition = {
  event: NotificationEvent;
  friendlyName: string;
  category: WhatsAppTemplateCategory;
  /** Numbered keys sent as ContentVariables — must match Twilio {{1}}, {{2}}, … */
  variables: Record<string, string>;
  body: string;
};

/** Canonical ARK WhatsApp template bodies for Twilio Content API / Console. */
export const WHATSAPP_TEMPLATE_DEFINITIONS: WhatsAppTemplateDefinition[] = [
  {
    event: 'otp',
    friendlyName: 'ark_otp_login',
    category: 'AUTHENTICATION',
    variables: { '1': 'otp_code' },
    body: 'Your ARK login code is {{1}}. Valid for 10 minutes. Do not share this code.',
  },
  {
    event: 'order_placed',
    friendlyName: 'ark_order_placed',
    category: 'UTILITY',
    variables: { '1': 'order_number', '2': 'order_total', '3': 'delivery_eta' },
    body: 'Order {{1}} placed successfully! Total: {{2}}. Estimated delivery: {{3}}. Track in the ARK app.',
  },
  {
    event: 'order_confirmed',
    friendlyName: 'ark_order_confirmed',
    category: 'UTILITY',
    variables: { '1': 'order_number', '2': 'delivery_eta' },
    body: 'Order {{1}} is confirmed. Estimated delivery: {{2}}.',
  },
  {
    event: 'order_out_for_delivery',
    friendlyName: 'ark_order_out_for_delivery',
    category: 'UTILITY',
    variables: { '1': 'order_number', '2': 'delivery_eta' },
    body: 'Order {{1}} is out for delivery. ETA: {{2}}.',
  },
  {
    event: 'order_delivered',
    friendlyName: 'ark_order_delivered',
    category: 'UTILITY',
    variables: { '1': 'order_number' },
    body: 'Order {{1}} has been delivered. Thank you for shopping with ARK!',
  },
  {
    event: 'order_cancelled',
    friendlyName: 'ark_order_cancelled',
    category: 'UTILITY',
    variables: { '1': 'order_number' },
    body: 'Order {{1}} has been cancelled. Contact ARK support if you need help.',
  },
  {
    event: 'quote_received',
    friendlyName: 'ark_quote_received',
    category: 'UTILITY',
    variables: { '1': 'product_name', '2': 'quantity_and_unit' },
    body: 'We received your bulk quote request for {{1}} ({{2}}). Our team will contact you within 2 hours.',
  },
  {
    event: 'quote_contacted',
    friendlyName: 'ark_quote_contacted',
    category: 'UTILITY',
    variables: { '1': 'product_name' },
    body: 'Our procurement team is reviewing your quote for {{1}} and will call you shortly.',
  },
  {
    event: 'quote_quoted',
    friendlyName: 'ark_quote_quoted',
    category: 'UTILITY',
    variables: { '1': 'product_name', '2': 'quoted_price' },
    body: 'Your bulk quote for {{1}} is ready: {{2}}. Open the ARK app to view details.',
  },
  {
    event: 'quote_closed',
    friendlyName: 'ark_quote_closed',
    category: 'UTILITY',
    variables: { '1': 'product_name' },
    body: 'Your quote request for {{1}} has been closed. Contact us anytime for a new quote.',
  },
  {
    event: 'return_received',
    friendlyName: 'ark_return_received',
    category: 'UTILITY',
    variables: { '1': 'order_number', '2': 'product_name' },
    body: 'Return request received for {{2}} (Order {{1}}). We will review and update you soon.',
  },
  {
    event: 'return_approved',
    friendlyName: 'ark_return_approved',
    category: 'UTILITY',
    variables: { '1': 'order_number' },
    body: 'Return approved for Order {{1}}. Please keep the item ready for pickup.',
  },
  {
    event: 'return_rejected',
    friendlyName: 'ark_return_rejected',
    category: 'UTILITY',
    variables: { '1': 'order_number' },
    body: 'Return request for Order {{1}} could not be approved. Check the ARK app for details.',
  },
  {
    event: 'return_completed',
    friendlyName: 'ark_return_completed',
    category: 'UTILITY',
    variables: { '1': 'order_number' },
    body: 'Return for Order {{1}} is complete. Refund will be processed as per policy.',
  },
];

export function getTemplateDefinition(event: NotificationEvent): WhatsAppTemplateDefinition | undefined {
  return WHATSAPP_TEMPLATE_DEFINITIONS.find((t) => t.event === event);
}
