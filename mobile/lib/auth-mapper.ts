import type { AuthUser } from '@/lib/types';

/** Map Strapi users-permissions user payload to app AuthUser. */
export function mapStrapiAuthUser(user: Record<string, unknown>, phoneHint?: string): AuthUser {
  const username = user.username as string | undefined;
  const resolvedPhone =
    (user.phone as string | undefined) ??
    phoneHint ??
    (username?.startsWith('user_') ? username.replace('user_', '') : undefined);

  return {
    id: user.id as number,
    username,
    email: user.email as string | undefined,
    phone: resolvedPhone,
    displayName:
      (user.displayName as string | undefined) ??
      (resolvedPhone ? `Contractor ${resolvedPhone.slice(-4)}` : 'Contractor'),
    contractorId:
      (user.contractorId as string | undefined) ??
      (resolvedPhone ? `CON-${resolvedPhone.slice(-4)}` : undefined),
    isProfessional: Boolean(user.isProfessional),
    listedAsProfessional: Boolean(user.listedAsProfessional),
    professionType: (user.professionType as AuthUser['professionType']) ?? null,
    professionalBio: (user.professionalBio as string | null) ?? null,
    onboardingComplete: user.onboardingComplete !== false,
  };
}
