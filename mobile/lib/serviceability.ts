import { fetchServiceablePincodes } from '@/lib/api';

/** Fallback Hyderabad pincodes when CMS is unreachable. */
export const FALLBACK_PINCODES = new Set([
  '500001', '500002', '500003', '500004', '500028', '500032', '500034',
  '500081', '500082', '500084', '500085', '500090', '500091', '500096',
]);

let cachedPincodes: Set<string> | null = null;
let cacheExpiry = 0;

export async function loadServiceablePincodes(): Promise<Set<string>> {
  if (cachedPincodes && Date.now() < cacheExpiry) return cachedPincodes;

  try {
    const res = await fetchServiceablePincodes();
    const set = new Set(res.data.map((p) => p.pincode));
    if (set.size > 0) {
      cachedPincodes = set;
      cacheExpiry = Date.now() + 30 * 60 * 1000;
      return set;
    }
  } catch {
    // use fallback
  }

  return FALLBACK_PINCODES;
}

export function isPincodeServiceableSync(pincode: string, serviceable?: Set<string>) {
  const normalized = pincode.replace(/\D/g, '').slice(0, 6);
  if (normalized.length !== 6) return false;
  const set = serviceable ?? cachedPincodes ?? FALLBACK_PINCODES;
  return set.has(normalized);
}

export async function isPincodeServiceable(pincode: string) {
  const set = await loadServiceablePincodes();
  return isPincodeServiceableSync(pincode, set);
}
