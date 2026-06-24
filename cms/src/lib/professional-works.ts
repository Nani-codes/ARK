export type ProfessionalWork = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
};

const MAX_WORKS = 12;

export function normalizeProfessionalWorks(raw: unknown): ProfessionalWork[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as Record<string, unknown>;
      const title = typeof row.title === 'string' ? row.title.trim() : '';
      if (!title) return null;

      const id =
        typeof row.id === 'string' && row.id.trim()
          ? row.id.trim()
          : `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      return {
        id,
        title,
        description:
          typeof row.description === 'string' && row.description.trim()
            ? row.description.trim()
            : undefined,
        imageUrl:
          typeof row.imageUrl === 'string' && row.imageUrl.trim()
            ? row.imageUrl.trim()
            : undefined,
      } satisfies ProfessionalWork;
    })
    .filter((entry) => entry !== null)
    .slice(0, MAX_WORKS);
}

export function mapProfessionalProfile(user: Record<string, unknown>) {
  const works = normalizeProfessionalWorks(user.professionalWorks);
  const coverImageUrl = works.find((work) => work.imageUrl)?.imageUrl;

  return {
    id: user.id as number,
    displayName:
      (user.displayName as string) ??
      (user.username as string)?.replace('user_', '') ??
      'Professional',
    contractorId: (user.contractorId as string) ?? undefined,
    phone: (user.phone as string) ?? (user.username as string)?.replace('user_', ''),
    professionType: (user.professionType as string) ?? null,
    professionalBio: (user.professionalBio as string) ?? null,
    professionalWorks: works,
    workCount: works.length,
    coverImageUrl,
  };
}
