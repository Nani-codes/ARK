import { mapProfessionalProfile, normalizeProfessionalWorks } from './mapProfessional';

export function mapAuthUser(user: Record<string, unknown>, phone?: string) {
  const resolvedPhone =
    (user.phone as string) ?? phone ?? (user.username as string)?.replace('user_', '');

  return {
    id: user.id as number,
    username: user.username as string,
    email: user.email as string,
    phone: resolvedPhone,
    displayName:
      (user.displayName as string) ??
      (resolvedPhone ? `Contractor ${String(resolvedPhone).slice(-4)}` : 'Contractor'),
    contractorId:
      (user.contractorId as string) ??
      (resolvedPhone ? `CON-${String(resolvedPhone).slice(-4)}` : undefined),
    isProfessional: Boolean(user.isProfessional),
    listedAsProfessional: Boolean(user.listedAsProfessional),
    professionType: (user.professionType as string) ?? null,
    professionalBio: (user.professionalBio as string) ?? null,
    professionalWorks: normalizeProfessionalWorks(user.professionalWorks),
    /** Only explicit `false` means onboarding pending; null/undefined = legacy user, skip prompt. */
    onboardingComplete: user.onboardingComplete !== false,
  };
}
