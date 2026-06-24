import { mediaUrl } from '@/lib/strapi';
import type { HomeBanner } from '@/lib/types';

type StrapiMediaRow = {
  url?: string;
  alternativeText?: string;
};

type RawHomeBanner = {
  id: number;
  documentId: string;
  title: string;
  link?: string | null;
  sortOrder?: number;
  active?: boolean;
  image?: StrapiMediaRow | null;
};

export function normalizeHomeBanner(raw: RawHomeBanner): HomeBanner | null {
  const imageUrl = mediaUrl(raw.image?.url);
  if (!imageUrl) return null;

  return {
    id: raw.id,
    documentId: raw.documentId,
    title: raw.title,
    imageUrl,
    link: raw.link?.trim() || undefined,
    sortOrder: raw.sortOrder ?? 0,
    active: raw.active !== false,
  };
}
