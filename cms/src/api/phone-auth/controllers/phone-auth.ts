import crypto from 'crypto';

import { mapAuthUser } from '../../../lib/mapAuthUser';

const OTP_STORE = new Map<string, { otp: string; expiresAt: number }>();

async function sendOtpSms(phone: string, otp: string) {
  const authKey = process.env.MSG91_AUTH_KEY;

  if (!authKey) {
    strapi.log.info(`[mock-otp] OTP for +91 ${phone}: ${otp} (or any 6 digits in dev)`);
    return;
  }

  try {
    const res = await fetch(
      `https://control.msg91.com/api/v5/otp?mobile=91${phone}&otp=${otp}`,
      {
        method: 'POST',
        headers: { authkey: authKey },
      }
    );
    if (!res.ok) {
      strapi.log.warn(`MSG91 OTP failed: ${await res.text()}`);
    }
  } catch (e) {
    strapi.log.error('MSG91 OTP error', e);
  }
}

export default {
  async sendOtp(ctx) {
    const { phone } = ctx.request.body ?? {};

    if (!phone || String(phone).length !== 10) {
      return ctx.badRequest('Valid 10-digit phone number is required');
    }

    const otp = process.env.MSG91_AUTH_KEY
      ? String(Math.floor(100000 + Math.random() * 900000))
      : '000000';

    OTP_STORE.set(String(phone), {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendOtpSms(String(phone), otp);

    ctx.send({ ok: true, message: 'OTP sent successfully' });
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
    const useRealOtp = !!process.env.MSG91_AUTH_KEY;

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
