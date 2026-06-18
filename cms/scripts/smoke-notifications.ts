/**
 * Smoke test notification utilities in stub mode (no Twilio credentials required).
 * Run: npx tsx scripts/smoke-notifications.ts
 */
import { toWhatsAppAddress, sendTwilioWhatsAppTemplate } from '../src/utils/twilio-whatsapp';
import { getTemplateContentSid, isTwilioConfigured } from '../src/config/notification-templates';

const log = {
  info: (msg: string) => console.log(`[info] ${msg}`),
  warn: (msg: string) => console.warn(`[warn] ${msg}`),
};

async function main() {
  console.log('Twilio configured:', isTwilioConfigured());
  console.log('OTP template SID:', getTemplateContentSid('otp') ?? '(not set — stub mode)');

  const wa = toWhatsAppAddress('9553721960');
  console.log('WhatsApp address:', wa);
  if (wa !== 'whatsapp:+919553721960') {
    throw new Error(`Unexpected address: ${wa}`);
  }

  const otpResult = await sendTwilioWhatsAppTemplate({ log }, 'otp', '9553721960', { '1': '409173' });
  console.log('OTP send result:', otpResult);
  if (!otpResult.ok) throw new Error('OTP stub send failed');

  const orderResult = await sendTwilioWhatsAppTemplate({ log }, 'order_placed', '9553721960', {
    '1': 'ORD-12345678',
    '2': '₹1,999',
    '3': 'Mon, 2 Jun, 10:00 am',
  });
  console.log('Order placed result:', orderResult);
  if (!orderResult.ok) throw new Error('Order stub send failed');

  console.log('\nSmoke test passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
