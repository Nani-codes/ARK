import crypto from 'crypto';

export default {
  async sendOtp(ctx) {
    const { phone } = ctx.request.body ?? {};

    if (!phone || String(phone).length !== 10) {
      return ctx.badRequest('Valid 10-digit phone number is required');
    }

    strapi.log.info(`[mock-otp] OTP requested for +91 ${phone} (any 6 digits will work)`);

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

    const authenticatedRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (!authenticatedRole) {
      return ctx.internalServerError('Authenticated role not found');
    }

    const username = `user_${phone}`;

    let user = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({ where: { username } });

    if (!user) {
      const password = crypto.randomBytes(16).toString('hex');
      user = await strapi.plugins['users-permissions'].services.user.add({
        username,
        email: `${phone}@ark.local`,
        password,
        confirmed: true,
        role: authenticatedRole.id,
        provider: 'local',
      });
    }

    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: user.id,
    });

    const displayName = `Contractor ${phone.slice(-4)}`;

    ctx.send({
      jwt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: String(phone),
        displayName,
        contractorId: `CON-${phone.slice(-4)}`,
      },
    });
  },
};
