import type { ProfessionType } from '@/lib/types';

export const PROFESSION_OPTIONS: { key: ProfessionType; label: string; icon: string }[] = [
  { key: 'contractor', label: 'Contractor / Builder', icon: 'engineering' },
  { key: 'architect', label: 'Architect', icon: 'architecture' },
  { key: 'interior_designer', label: 'Interior Designer', icon: 'weekend' },
  { key: 'electrician', label: 'Electrician', icon: 'bolt' },
  { key: 'plumber', label: 'Plumber', icon: 'plumbing' },
  { key: 'painter', label: 'Painter', icon: 'format-paint' },
  { key: 'other', label: 'Other Professional', icon: 'handyman' },
];

export function professionLabel(type?: ProfessionType | null, otherProfession?: string | null) {
  if (!type) return 'Professional';
  if (type === 'other' && otherProfession?.trim()) return otherProfession.trim();
  return PROFESSION_OPTIONS.find((p) => p.key === type)?.label ?? 'Professional';
}

export function professionIcon(type?: ProfessionType | null) {
  if (!type) return 'person';
  return PROFESSION_OPTIONS.find((p) => p.key === type)?.icon ?? 'handyman';
}
