import type { Core } from '@strapi/strapi';

import { normalizeProfessionalWorks } from '../lib/professional-works';

const MIGRATION_KEY = 'professionals_v2_migrated';

export async function migrateLegacyProfessionals(strapi: Core.Strapi) {
  const store = strapi.store({ type: 'plugin', name: 'ark' });
  const done = await store.get({ key: MIGRATION_KEY });
  if (done) return;

  const users = await strapi.db.query('plugin::users-permissions.user').findMany({
    where: { isProfessional: true },
  });

  let migratedProfiles = 0;
  let migratedProjects = 0;

  for (const user of users) {
    const existing = await strapi.db.query('api::professional-profile.professional-profile').findOne({
      where: { user: user.id },
    });
    if (existing) continue;

    const phone =
      (user.phone as string) ??
      (user.username as string)?.replace('user_', '');

    const profile = await strapi.db.query('api::professional-profile.professional-profile').create({
      data: {
        user: user.id,
        displayName:
          (user.displayName as string) ??
          (phone ? `Contractor ${String(phone).slice(-4)}` : 'Professional'),
        bio: (user.professionalBio as string) ?? null,
        professionType: (user.professionType as string) ?? 'other',
        phone: phone ?? null,
        whatsapp: phone ?? null,
        listed: Boolean(user.listedAsProfessional),
        verified: false,
        yearsExperience: 0,
        city: 'Hyderabad',
      },
    });

    migratedProfiles++;

    const works = normalizeProfessionalWorks(user.professionalWorks);
    for (let i = 0; i < works.length; i++) {
      const work = works[i];
      await strapi.db.query('api::portfolio-project.portfolio-project').create({
        data: {
          professional: profile.id,
          title: work.title,
          description: work.description ?? null,
          legacyImageUrl: work.imageUrl ?? null,
          sortOrder: i,
        },
      });
      migratedProjects++;
    }
  }

  await store.set({ key: MIGRATION_KEY, value: true });
  if (migratedProfiles > 0) {
    strapi.log.info(
      `Migrated ${migratedProfiles} professional profiles and ${migratedProjects} portfolio projects`
    );
  }
}
