import { mapAuthUser } from '../../../lib/mapAuthUser';
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

    if (body.isProfessional === false) {
      data.listedAsProfessional = false;
      data.professionType = null;
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
      data: professionals.map((u) => {
        const mapped = mapAuthUser(u);
        return {
          id: mapped.id,
          displayName: mapped.displayName,
          contractorId: mapped.contractorId,
          phone: mapped.phone,
          professionType: mapped.professionType,
          professionalBio: mapped.professionalBio,
        };
      }),
    });
  },
};
