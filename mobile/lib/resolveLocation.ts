import * as Location from 'expo-location';

import {
  DEFAULT_DELIVERY_ADDRESS,
  DEFAULT_LOCATION_SHORT,
} from '@/lib/locationDefaults';

export type ResolvedLocation = {
  shortLabel: string;
  deliveryAddress: string;
  source: 'device' | 'default';
};

function uniqueParts(parts: (string | null | undefined)[]) {
  const seen = new Set<string>();
  return parts.filter((p): p is string => {
    if (!p?.trim()) return false;
    const key = p.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatGeocodedAddress(geo: Location.LocationGeocodedAddress): string {
  const parts = uniqueParts([
    geo.name,
    geo.street,
    geo.district,
    geo.subregion,
    geo.city,
    geo.region,
    geo.postalCode,
    geo.country,
  ]);
  return parts.join(', ') || DEFAULT_DELIVERY_ADDRESS;
}

export function formatGeocodedShortLabel(geo: Location.LocationGeocodedAddress): string {
  const city = geo.city ?? geo.subregion ?? geo.region;
  const area = geo.district ?? geo.name ?? geo.street;
  if (area && city && area.toLowerCase() !== city.toLowerCase()) {
    return `${area}, ${city}`;
  }
  return city ?? area ?? DEFAULT_LOCATION_SHORT;
}

export async function resolveCurrentLocation(): Promise<ResolvedLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const [geo] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    if (!geo) return null;

    return {
      shortLabel: formatGeocodedShortLabel(geo),
      deliveryAddress: formatGeocodedAddress(geo),
      source: 'device',
    };
  } catch {
    return null;
  }
}

export function getDefaultLocation(): ResolvedLocation {
  return {
    shortLabel: DEFAULT_LOCATION_SHORT,
    deliveryAddress: DEFAULT_DELIVERY_ADDRESS,
    source: 'default',
  };
}
