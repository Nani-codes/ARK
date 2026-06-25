import { brand } from './theme';
import type { SavedAddress } from './types';

export const ADDRESS_TYPE_CONFIG = {
  home:  { label: 'Home',  icon: 'home'        as const, color: '#1a8038' },
  work:  { label: 'Work',  icon: 'business'    as const, color: brand.navy },
  other: { label: 'Other', icon: 'location-on' as const, color: brand.goldDark },
} as const;

export function formatFullAddress(a: SavedAddress): string {
  return [
    a.flat,
    a.building,
    a.street,
    a.landmark ? `Near ${a.landmark}` : undefined,
    a.city,
    a.state,
    a.pincode,
  ]
    .filter((p): p is string => Boolean(p?.trim()))
    .join(', ');
}

export function formatShortLabel(a: SavedAddress): string {
  return [(a.flat || a.street), a.city].filter(Boolean).join(', ');
}

// ── OSM Nominatim ─────────────────────────────────────────────────────────────

export type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
  };
};

export async function nominatimSearch(
  query: string,
  signal?: AbortSignal
): Promise<NominatimResult[]> {
  if (!query.trim() || query.length < 3) return [];
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '6',
    countrycodes: 'in',
  });
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { 'User-Agent': 'ARK-Procurement/1.0' }, signal }
    );
    if (!res.ok) return [];
    return res.json() as Promise<NominatimResult[]>;
  } catch {
    return [];
  }
}

export function parseNominatim(r: NominatimResult) {
  const a = r.address;
  return {
    flat: a.house_number ?? '',
    building: '',
    street: [a.road, a.suburb ?? a.neighbourhood].filter(Boolean).join(', '),
    landmark: '',
    city: a.city ?? a.town ?? '',
    state: a.state ?? '',
    pincode: a.postcode ?? '',
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  };
}
