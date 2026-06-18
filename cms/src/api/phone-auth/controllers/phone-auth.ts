import crypto from 'crypto';

import { isTwilioConfigured } from '../../../config/notification-templates';
import { mapAuthUser } from '../../../lib/mapAuthUser';
import { notifyUser } from '../../../utils/notify-user';

const OTP_STORE = new Map<string, { otp: string; expiresAt: number }>();

export default {
  async sendOtp(ctx) {
    const { phone } = ctx.request.body ?? {};

    if (!phone || String(phone).length !== 10) {
      return ctx.badRequest('Valid 10-digit phone number is required');
    }

    const useRealOtp = isTwilioConfigured();
    const otp = useRealOtp
      ? String(Math.floor(100000 + Math.random() * 900000))
      : '000000';

    OTP_STORE.set(String(phone), {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const { whatsapp } = await notifyUser(strapi, {
      phone: String(phone),
      event: 'otp',
      variables: { '1': otp },
    });

    const delivered = whatsapp?.ok && !whatsapp?.deliveryFailed;

    if (!delivered) {
      strapi.log.warn(
        `[otp-fallback] OTP for +91 ${phone}: ${otp}. WhatsApp not delivered${whatsapp?.error ? ` — ${whatsapp.error}` : ''}`
      );
    }

    ctx.send({
      ok: true,
      message: delivered
        ? 'OTP sent to your WhatsApp'
        : 'OTP generated but WhatsApp delivery failed. Join Twilio sandbox or check server logs.',
      whatsappDelivered: delivered,
      deliveryHint: delivered
        ? undefined
        : 'Open WhatsApp and send join <your-sandbox-code> to +1 415 523 8886 (see Twilio Console → Messaging → Try WhatsApp)',
    });
  },

  async verify(ctx) {
    const { phone, otp } = ctx.request.body ?? {};

    if (!phone || String(phone).length !== 10) {
      return ctx.badRequest('Valid 10-digit phone number is required');
    }

    if (!otp || String(otp).length !== 6) {
      return ctx.badRequest('Valid 6-digit OTP is required');
    }

    const stored = OTP_STORE.get(String(phone));
    const useRealOtp = isTwilioConfigured();

    if (useRealOtp) {
      if (!stored || stored.expiresAt < Date.now() || stored.otp !== String(otp)) {
        return ctx.badRequest('Invalid or expired OTP');
      }
      OTP_STORE.delete(String(phone));
    }

    const authenticatedRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (!authenticatedRole) {
      return ctx.internalServerError('Authenticated role not found');
    }

    const username = `user_${phone}`;
    const displayName = `Contractor ${phone.slice(-4)}`;
    const contractorId = `CON-${phone.slice(-4)}`;

    let user = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({ where: { username } });

    const isNewUser = !user;

    if (!user) {
      const password = crypto.randomBytes(16).toString('hex');
      user = await strapi.plugins['users-permissions'].services.user.add({
        username,
        email: `${phone}@ark.local`,
        password,
        confirmed: true,
        role: authenticatedRole.id,
        provider: 'local',
        phone: String(phone),
        displayName,
        contractorId,
        isProfessional: false,
        listedAsProfessional: false,
        onboardingComplete: false,
      });
    } else if (!user.phone) {
      user = await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { phone: String(phone) },
      });
    }

    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: user.id,
    });

    ctx.send({
      jwt,
      user: mapAuthUser(user, String(phone)),
      isNewUser,
    });
  },
};
