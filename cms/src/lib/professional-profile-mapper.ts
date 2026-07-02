type MediaRow = { url?: string; alternativeText?: string | null } | null | undefined;

export function mediaToUrl(media: MediaRow | MediaRow[] | number | null | undefined): string | undefined {
  if (!media) return undefined;
  if (typeof media === 'number') return undefined;
  if (Array.isArray(media)) {
    const first = media[0];
    return first?.url ?? undefined;
  }
  return media.url ?? undefined;
}

export function mediaListToUrls(
  media: MediaRow | MediaRow[] | number | null | undefined
): string[] {
  if (!media) return [];
  if (typeof media === 'number') return [];
  if (!Array.isArray(media)) {
    const url = media.url;
    return url ? [url] : [];
  }
  return media.map((m) => m?.url).filter((url): url is string => Boolean(url));
}

export type MappedSpecialty = {
  id: number;
  name: string;
  slug: string;
  trade?: string;
};

export type MappedServiceArea = {
  id: number;
  pincode: string;
  city?: string;
  zone?: string;
};

export type MappedPortfolioProject = {
  id: number;
  documentId?: string;
  title: string;
  description?: string | null;
  imageUrls: string[];
  legacyImageUrl?: string;
  completedAt?: string | null;
  location?: string | null;
  sortOrder: number;
};

export type MappedReview = {
  id: number;
  rating: number;
  comment?: string | null;
  authorName: string;
  createdAt?: string;
};

export type MappedProfessionalProfile = {
  id: number;
  documentId?: string;
  userId?: number;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string;
  coverImageUrl?: string;
  professionType: string;
  otherProfession?: string | null;
  yearsExperience: number;
  city?: string | null;
  phone?: string;
  whatsapp?: string;
  email?: string | null;
  listed: boolean;
  verified: boolean;
  ratingAverage: number;
  ratingCount: number;
  specialties: MappedSpecialty[];
  serviceAreas: MappedServiceArea[];
  portfolioProjects?: MappedPortfolioProject[];
  reviews?: MappedReview[];
  workCount: number;
  contractorId?: string;
};

function mapSpecialty(row: Record<string, unknown>): MappedSpecialty {
  return {
    id: row.id as number,
    name: row.name as string,
    slug: row.slug as string,
    trade: (row.trade as string) ?? undefined,
  };
}

function mapServiceArea(row: Record<string, unknown>): MappedServiceArea {
  return {
    id: row.id as number,
    pincode: row.pincode as string,
    city: (row.city as string) ?? undefined,
    zone: (row.zone as string) ?? undefined,
  };
}

export function mapPortfolioProject(row: Record<string, unknown>): MappedPortfolioProject {
  const imageUrls = mediaListToUrls(row.images as MediaRow[]);
  const legacyImageUrl = (row.legacyImageUrl as string) ?? undefined;

  return {
    id: row.id as number,
    documentId: row.documentId as string | undefined,
    title: row.title as string,
    description: (row.description as string) ?? null,
    imageUrls: imageUrls.length ? imageUrls : legacyImageUrl ? [legacyImageUrl] : [],
    legacyImageUrl,
    completedAt: (row.completedAt as string) ?? null,
    location: (row.location as string) ?? null,
    sortOrder: Number(row.sortOrder ?? 0),
  };
}

export function mapReview(row: Record<string, unknown>): MappedReview {
  const author = row.author as Record<string, unknown> | undefined;
  const authorName =
    (author?.displayName as string) ??
    (author?.username as string)?.replace('user_', '') ??
    'Customer';

  return {
    id: row.id as number,
    rating: Number(row.rating),
    comment: (row.comment as string) ?? null,
    authorName,
    createdAt: (row.createdAt as string) ?? undefined,
  };
}

const PROFILE_POPULATE = {
  avatar: true,
  coverImage: true,
  specialties: true,
  serviceAreas: true,
  user: true,
  portfolioProjects: {
    populate: { images: true },
  },
  reviews: {
    populate: { author: true },
  },
};

export function getProfilePopulate(deep = true) {
  if (!deep) {
    return {
      avatar: true,
      coverImage: true,
      specialties: true,
      serviceAreas: true,
      user: true,
      portfolioProjects: { populate: { images: true } },
    };
  }
  return PROFILE_POPULATE;
}

export function mapProfessionalProfile(
  row: Record<string, unknown>,
  options: { includeProjects?: boolean; includeReviews?: boolean; projectLimit?: number } = {}
): MappedProfessionalProfile {
  const { includeProjects = true, includeReviews = false, projectLimit } = options;

  const user = row.user as Record<string, unknown> | undefined;
  const projectsRaw = (row.portfolioProjects as Record<string, unknown>[] | undefined) ?? [];
  const projects = includeProjects
    ? projectsRaw
        .map(mapPortfolioProject)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .slice(0, projectLimit ?? projectsRaw.length)
    : undefined;

  const coverFromProject = projects?.find((p) => p.imageUrls[0])?.imageUrls[0];
  const avatarUrl = mediaToUrl(row.avatar as MediaRow);
  const coverImageUrl = mediaToUrl(row.coverImage as MediaRow) ?? coverFromProject;

  const phone =
    (row.phone as string) ??
    (user?.phone as string) ??
    (user?.username as string)?.replace('user_', '');

  const contractorId =
    (user?.contractorId as string) ??
    (phone ? `CON-${String(phone).slice(-4)}` : undefined);

  return {
    id: row.id as number,
    documentId: row.documentId as string | undefined,
    userId: user?.id as number | undefined,
    displayName: (row.displayName as string) ?? 'Professional',
    headline: (row.headline as string) ?? null,
    bio: (row.bio as string) ?? null,
    avatarUrl,
    coverImageUrl,
    professionType: row.professionType as string,
    otherProfession: (row.otherProfession as string) ?? null,
    yearsExperience: Number(row.yearsExperience ?? 0),
    city: (row.city as string) ?? null,
    phone,
    whatsapp: (row.whatsapp as string) ?? phone,
    email: (row.email as string) ?? null,
    listed: Boolean(row.listed),
    verified: Boolean(row.verified),
    ratingAverage: Number(row.ratingAverage ?? 0),
    ratingCount: Number(row.ratingCount ?? 0),
    specialties: ((row.specialties as Record<string, unknown>[]) ?? []).map(mapSpecialty),
    serviceAreas: ((row.serviceAreas as Record<string, unknown>[]) ?? []).map(mapServiceArea),
    portfolioProjects: projects,
    reviews: includeReviews
      ? ((row.reviews as Record<string, unknown>[]) ?? [])
          .map(mapReview)
          .sort(
            (a, b) =>
              new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
          )
          .slice(0, 20)
      : undefined,
    workCount: projectsRaw.length,
    contractorId,
  };
}

export async function recomputeProfessionalRatings(professionalId: number) {
  const reviews = await strapi.db.query('api::professional-review.professional-review').findMany({
    where: { professional: professionalId },
  });

  const ratingCount = reviews.length;
  const ratingAverage =
    ratingCount > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / ratingCount
      : 0;

  await strapi.db.query('api::professional-profile.professional-profile').update({
    where: { id: professionalId },
    data: {
      ratingAverage: Math.round(ratingAverage * 10) / 10,
      ratingCount,
    },
  });
}

export async function findProfileByUserId(userId: number) {
  return strapi.db.query('api::professional-profile.professional-profile').findOne({
    where: { user: userId },
    populate: getProfilePopulate(true),
  });
}

export async function findProfileById(id: number, deep = true) {
  return strapi.db.query('api::professional-profile.professional-profile').findOne({
    where: { id },
    populate: getProfilePopulate(deep),
  });
}
