import { resolveAuthUser } from '../../../lib/resolveAuthUser';
import {
  findProfileById,
  findProfileByUserId,
  getProfilePopulate,
  mapPortfolioProject,
  mapProfessionalProfile,
  mapReview,
} from '../../../lib/professional-profile-mapper';
import { notifyUser } from '../../../utils/notify-user';

const MAX_PROJECTS = 12;

function parsePositiveInt(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function parseSort(sort: unknown) {
  const allowed = ['top_rated', 'most_projects', 'recent', 'experience'] as const;
  if (typeof sort === 'string' && allowed.includes(sort as (typeof allowed)[number])) {
    return sort as (typeof allowed)[number];
  }
  return 'recent';
}

async function requireOwnedProfile(ctx: { state: { user?: { id: number } }; request: { header: { authorization?: string } } }) {
  const user = await resolveAuthUser(ctx);
  if (!user) return { error: 'unauthorized' as const };

  let profile = await findProfileByUserId(user.id);
  if (!profile) {
    profile = await strapi.db.query('api::professional-profile.professional-profile').create({
      data: {
        user: user.id,
        displayName:
          (user.displayName as string) ??
          (user.phone as string)
            ? `Contractor ${String(user.phone).slice(-4)}`
            : 'Professional',
        professionType: 'contractor',
        phone: (user.phone as string) ?? null,
        listed: false,
      },
      populate: getProfilePopulate(true),
    });
  }

  return { user, profile };
}

async function resolveSpecialtyIds(raw: unknown): Promise<number[]> {
  if (!Array.isArray(raw)) return [];
  const ids: number[] = [];
  for (const entry of raw) {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      ids.push(entry);
      continue;
    }
    if (typeof entry === 'string' && entry.trim()) {
      const bySlug = await strapi.db.query('api::specialty.specialty').findOne({
        where: { slug: entry.trim() },
      });
      if (bySlug?.id) ids.push(bySlug.id);
    }
  }
  return [...new Set(ids)];
}

async function resolveServiceAreaIds(raw: unknown): Promise<number[]> {
  if (!Array.isArray(raw)) return [];
  const ids: number[] = [];
  for (const entry of raw) {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      ids.push(entry);
      continue;
    }
    if (typeof entry === 'string' && entry.trim()) {
      const byPincode = await strapi.db.query('api::serviceable-pincode.serviceable-pincode').findOne({
        where: { pincode: entry.trim() },
      });
      if (byPincode?.id) ids.push(byPincode.id);
    }
  }
  return [...new Set(ids)];
}

export default {
  async listProfessionals(ctx) {
    const q = typeof ctx.query.q === 'string' ? ctx.query.q.trim().toLowerCase() : '';
    const trade = typeof ctx.query.trade === 'string' ? ctx.query.trade.trim() : '';
    const city = typeof ctx.query.city === 'string' ? ctx.query.city.trim().toLowerCase() : '';
    const pincode = typeof ctx.query.pincode === 'string' ? ctx.query.pincode.trim() : '';
    const minRating = Number(ctx.query.minRating ?? 0);
    const minExperience = Number(ctx.query.minExperience ?? 0);
    const sort = parseSort(ctx.query.sort);
    const page = parsePositiveInt(ctx.query.page, 1);
    const pageSize = Math.min(parsePositiveInt(ctx.query.pageSize, 20), 50);

    const where: Record<string, unknown> = { listed: true };

    if (trade) where.professionType = trade;
    if (Number.isFinite(minRating) && minRating > 0) {
      where.ratingAverage = { $gte: minRating };
    }
    if (Number.isFinite(minExperience) && minExperience > 0) {
      where.yearsExperience = { $gte: minExperience };
    }
    if (city) {
      where.city = { $containsi: city };
    }

    let professionals = await strapi.db.query('api::professional-profile.professional-profile').findMany({
      where,
      populate: getProfilePopulate(false),
    });

    if (q) {
      professionals = professionals.filter((row) => {
        const haystack = [
          row.displayName,
          row.headline,
          row.bio,
          ...(row.specialties ?? []).map((s: { name?: string }) => s.name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    if (pincode) {
      professionals = professionals.filter((row) =>
        (row.serviceAreas ?? []).some((area: { pincode?: string }) => area.pincode === pincode)
      );
    }

    professionals.sort((a, b) => {
      if (sort === 'top_rated') {
        const diff = Number(b.ratingAverage ?? 0) - Number(a.ratingAverage ?? 0);
        if (diff !== 0) return diff;
        return Number(b.ratingCount ?? 0) - Number(a.ratingCount ?? 0);
      }
      if (sort === 'experience') {
        return Number(b.yearsExperience ?? 0) - Number(a.yearsExperience ?? 0);
      }
      if (sort === 'most_projects') {
        return (b.portfolioProjects?.length ?? 0) - (a.portfolioProjects?.length ?? 0);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const total = professionals.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const slice = professionals.slice(start, start + pageSize);

    ctx.send({
      data: slice.map((row) =>
        mapProfessionalProfile(row as Record<string, unknown>, {
          includeProjects: false,
        })
      ),
      meta: {
        pagination: { page, pageSize, pageCount, total },
      },
    });
  },

  async getProfessional(ctx) {
    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) return ctx.badRequest('Invalid professional id');

    const profile = await findProfileById(id, true);
    if (!profile || !profile.listed) {
      return ctx.notFound('Professional not found');
    }

    ctx.send({
      data: mapProfessionalProfile(profile as Record<string, unknown>, {
        includeProjects: true,
        includeReviews: true,
      }),
    });
  },

  async me(ctx) {
    const user = await resolveAuthUser(ctx);
    if (!user) return ctx.unauthorized('You must be logged in');

    const profile = await findProfileByUserId(user.id);
    ctx.send({
      data: profile
        ? mapProfessionalProfile(profile as Record<string, unknown>, {
            includeProjects: true,
            includeReviews: false,
          })
        : null,
    });
  },

  async updateMe(ctx) {
    const result = await requireOwnedProfile(ctx);
    if ('error' in result) return ctx.unauthorized('You must be logged in');

    const { user, profile } = result;
    const body = ctx.request.body ?? {};
    const data: Record<string, unknown> = {};

    if (typeof body.displayName === 'string' && body.displayName.trim()) {
      data.displayName = body.displayName.trim();
    }
    if (body.headline !== undefined) {
      data.headline = typeof body.headline === 'string' ? body.headline.trim() || null : null;
    }
    if (body.bio !== undefined) {
      data.bio = typeof body.bio === 'string' ? body.bio.trim() || null : null;
    }
    if (body.professionType) data.professionType = body.professionType;
    if (body.otherProfession !== undefined) {
      data.otherProfession =
        typeof body.otherProfession === 'string' ? body.otherProfession.trim() || null : null;
    }
    if (body.professionType && body.professionType !== 'other') {
      data.otherProfession = null;
    }
    if (
      (body.professionType === 'other' ||
        (!body.professionType && profile.professionType === 'other')) &&
      body.otherProfession !== undefined &&
      !(typeof body.otherProfession === 'string' && body.otherProfession.trim())
    ) {
      return ctx.badRequest('Please specify your profession');
    }
    if (body.yearsExperience !== undefined) {
      data.yearsExperience = Math.max(0, Number(body.yearsExperience) || 0);
    }
    if (body.city !== undefined) {
      data.city = typeof body.city === 'string' ? body.city.trim() || null : null;
    }
    if (body.phone !== undefined) {
      data.phone = typeof body.phone === 'string' ? body.phone.trim() || null : null;
    }
    if (body.whatsapp !== undefined) {
      data.whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() || null : null;
    }
    if (body.email !== undefined) {
      data.email = typeof body.email === 'string' ? body.email.trim() || null : null;
    }
    if (typeof body.listed === 'boolean') data.listed = body.listed;
    if (body.avatar !== undefined) data.avatar = body.avatar;
    if (body.coverImage !== undefined) data.coverImage = body.coverImage;

    if (body.specialtyIds !== undefined) {
      data.specialties = await resolveSpecialtyIds(body.specialtyIds);
    }
    if (body.serviceAreaIds !== undefined) {
      data.serviceAreas = await resolveServiceAreaIds(body.serviceAreaIds);
    }

    const updated = await strapi.db.query('api::professional-profile.professional-profile').update({
      where: { id: profile.id },
      data,
      populate: getProfilePopulate(true),
    });

    if (typeof body.isProfessional === 'boolean') {
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          isProfessional: body.isProfessional,
          listedAsProfessional: body.isProfessional ? Boolean(updated.listed) : false,
          professionType: body.isProfessional ? updated.professionType : null,
          onboardingComplete: true,
        },
      });
    } else if (typeof body.listed === 'boolean') {
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { listedAsProfessional: body.listed },
      });
    }

    ctx.send({
      data: mapProfessionalProfile(updated as Record<string, unknown>, {
        includeProjects: true,
      }),
    });
  },

  async createProject(ctx) {
    const result = await requireOwnedProfile(ctx);
    if ('error' in result) return ctx.unauthorized('You must be logged in');

    const { profile } = result;
    const existingCount = await strapi.db.query('api::portfolio-project.portfolio-project').count({
      where: { professional: profile.id },
    });
    if (existingCount >= MAX_PROJECTS) {
      return ctx.badRequest(`You can showcase up to ${MAX_PROJECTS} projects`);
    }

    const body = ctx.request.body ?? {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return ctx.badRequest('Project title is required');

    const project = await strapi.db.query('api::portfolio-project.portfolio-project').create({
      data: {
        professional: profile.id,
        title,
        description: typeof body.description === 'string' ? body.description.trim() || null : null,
        location: typeof body.location === 'string' ? body.location.trim() || null : null,
        completedAt: body.completedAt ?? null,
        sortOrder: Number(body.sortOrder ?? existingCount),
        images: Array.isArray(body.imageIds) ? body.imageIds : [],
        legacyImageUrl:
          typeof body.legacyImageUrl === 'string' ? body.legacyImageUrl.trim() || null : null,
      },
      populate: { images: true },
    });

    ctx.status = 201;
    ctx.send({ data: mapPortfolioProject(project as Record<string, unknown>) });
  },

  async updateProject(ctx) {
    const result = await requireOwnedProfile(ctx);
    if ('error' in result) return ctx.unauthorized('You must be logged in');

    const projectId = Number(ctx.params.projectId);
    if (!Number.isFinite(projectId)) return ctx.badRequest('Invalid project id');

    const project = await strapi.db.query('api::portfolio-project.portfolio-project').findOne({
      where: { id: projectId },
      populate: { professional: true, images: true },
    });
    if (!project) return ctx.notFound('Project not found');
    if (project.professional?.id !== result.profile.id) return ctx.forbidden('Not your project');

    const body = ctx.request.body ?? {};
    const data: Record<string, unknown> = {};
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (body.description !== undefined) {
      data.description = typeof body.description === 'string' ? body.description.trim() || null : null;
    }
    if (body.location !== undefined) {
      data.location = typeof body.location === 'string' ? body.location.trim() || null : null;
    }
    if (body.completedAt !== undefined) data.completedAt = body.completedAt;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;
    if (body.imageIds !== undefined) data.images = body.imageIds;
    if (body.legacyImageUrl !== undefined) {
      data.legacyImageUrl =
        typeof body.legacyImageUrl === 'string' ? body.legacyImageUrl.trim() || null : null;
    }

    const updated = await strapi.db.query('api::portfolio-project.portfolio-project').update({
      where: { id: projectId },
      data,
      populate: { images: true },
    });

    ctx.send({ data: mapPortfolioProject(updated as Record<string, unknown>) });
  },

  async deleteProject(ctx) {
    const result = await requireOwnedProfile(ctx);
    if ('error' in result) return ctx.unauthorized('You must be logged in');

    const projectId = Number(ctx.params.projectId);
    if (!Number.isFinite(projectId)) return ctx.badRequest('Invalid project id');

    const project = await strapi.db.query('api::portfolio-project.portfolio-project').findOne({
      where: { id: projectId },
      populate: { professional: true },
    });
    if (!project) return ctx.notFound('Project not found');
    if (project.professional?.id !== result.profile.id) return ctx.forbidden('Not your project');

    await strapi.db.query('api::portfolio-project.portfolio-project').delete({
      where: { id: projectId },
    });

    ctx.send({ ok: true });
  },

  async listReviews(ctx) {
    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) return ctx.badRequest('Invalid professional id');

    const profile = await findProfileById(id, false);
    if (!profile || !profile.listed) return ctx.notFound('Professional not found');

    const reviews = await strapi.db.query('api::professional-review.professional-review').findMany({
      where: { professional: id },
      populate: { author: true },
      orderBy: { createdAt: 'desc' },
    });

    ctx.send({ data: reviews.map((r) => mapReview(r as Record<string, unknown>)) });
  },

  async submitReview(ctx) {
    const user = await resolveAuthUser(ctx);
    if (!user) return ctx.unauthorized('You must be logged in');

    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) return ctx.badRequest('Invalid professional id');

    const profile = await findProfileById(id, false);
    if (!profile || !profile.listed) return ctx.notFound('Professional not found');
    if (profile.user?.id === user.id) {
      return ctx.badRequest('You cannot review your own profile');
    }

    const body = ctx.request.body ?? {};
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return ctx.badRequest('Rating must be between 1 and 5');
    }

    const existing = await strapi.db.query('api::professional-review.professional-review').findOne({
      where: { professional: id, author: user.id },
    });

    const comment = typeof body.comment === 'string' ? body.comment.trim() || null : null;
    const review = existing
      ? await strapi.db.query('api::professional-review.professional-review').update({
          where: { id: existing.id },
          data: { rating, comment },
          populate: { author: true },
        })
      : await strapi.db.query('api::professional-review.professional-review').create({
          data: { professional: id, author: user.id, rating, comment },
          populate: { author: true },
        });

    ctx.send({ data: mapReview(review as Record<string, unknown>) });
  },

  async requestCallback(ctx) {
    const user = await resolveAuthUser(ctx);
    if (!user) return ctx.unauthorized('You must be logged in');

    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) return ctx.badRequest('Invalid professional id');

    const profile = await findProfileById(id, false);
    if (!profile || !profile.listed) return ctx.notFound('Professional not found');

    const body = ctx.request.body ?? {};
    const message =
      typeof body.message === 'string' && body.message.trim()
        ? body.message.trim()
        : 'A customer requested a callback via ARK.';

    const customerPhone =
      (user.phone as string) ??
      (user.username as string)?.replace('user_', '') ??
      'unknown';

    const proUserId = profile.user?.id as number | undefined;
    await notifyUser(strapi, {
      userId: proUserId,
      phone: (profile.phone as string) ?? (profile.whatsapp as string),
      event: 'quote_received',
      variables: {
        '1': profile.displayName as string,
        '2': `Callback request from ${customerPhone}: ${message}`,
      },
      push: {
        title: 'New callback request',
        body: `${customerPhone} wants you to call them back.`,
        data: { type: 'professional_callback', professionalId: id },
      },
    });

    ctx.send({ ok: true });
  },
};
