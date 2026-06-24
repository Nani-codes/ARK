import { mapAuthUser } from '../../../lib/mapAuthUser';
import { mapProfessionalProfile } from '../../../lib/mapProfessional';
import { normalizeProfessionalWorks } from '../../../lib/professional-works';
import { resolveAuthUser } from '../../../lib/resolveAuthUser';

export default {
  async me(ctx) {
    const user = await resolveAuthUser(ctx);
    if (!user) return ctx.unauthorized('You must be logged in');

    ctx.send({ user: mapAuthUser(user) });
  },

  async updateMe(ctx) {
    const user = await resolveAuthUser(ctx);
    if (!user) return ctx.unauthorized('You must be logged in');

    const body = ctx.request.body ?? {};
    const data: Record<string, unknown> = {};

    if (typeof body.isProfessional === 'boolean') data.isProfessional = body.isProfessional;
    if (typeof body.listedAsProfessional === 'boolean') {
      data.listedAsProfessional = body.listedAsProfessional;
    }
    if (typeof body.onboardingComplete === 'boolean') {
      data.onboardingComplete = body.onboardingComplete;
    }
    if (body.professionType !== undefined) data.professionType = body.professionType;
    if (body.professionalBio !== undefined) data.professionalBio = body.professionalBio;
    if (body.displayName !== undefined) data.displayName = body.displayName;
    if (typeof body.expoPushToken === 'string') data.expoPushToken = body.expoPushToken;
    if (body.professionalWorks !== undefined) {
      data.professionalWorks = normalizeProfessionalWorks(body.professionalWorks);
    }

    if (body.isProfessional === false) {
      data.listedAsProfessional = false;
      data.professionType = null;
      data.professionalWorks = [];
    }

    if (body.isProfessional === true && body.onboardingComplete && !body.professionType) {
      return ctx.badRequest('Profession type is required for professionals');
    }

    const updated = await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data,
    });

    ctx.send({ user: mapAuthUser(updated) });
  },

  async savePushToken(ctx) {
    const user = await resolveAuthUser(ctx);
    if (!user) return ctx.unauthorized('You must be logged in');

    const { expoPushToken } = ctx.request.body ?? {};
    if (typeof expoPushToken !== 'string' || !expoPushToken.trim()) {
      return ctx.badRequest('expoPushToken is required');
    }

    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: { expoPushToken: expoPushToken.trim() },
    });

    ctx.send({ ok: true });
  },

  async listProfessionals(ctx) {
    const professionals = await strapi.db.query('plugin::users-permissions.user').findMany({
      where: {
        isProfessional: true,
        listedAsProfessional: true,
        professionType: { $notNull: true },
      },
      orderBy: { updatedAt: 'desc' },
    });

    ctx.send({
      data: professionals.map((u) => mapProfessionalProfile(u)),
    });
  },

  async getProfessional(ctx) {
    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) {
      return ctx.badRequest('Invalid professional id');
    }

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: {
        id,
        isProfessional: true,
        listedAsProfessional: true,
        professionType: { $notNull: true },
      },
    });

    if (!user) {
      return ctx.notFound('Professional not found');
    }

    ctx.send({ data: mapProfessionalProfile(user) });
  },
};
