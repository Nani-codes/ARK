import Constants from 'expo-constants';

const STRAPI_URL =
  process.env.EXPO_PUBLIC_STRAPI_URL ??
  Constants.expoConfig?.extra?.strapiUrl ??
  'http://localhost:1337';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function getStrapiUrl() {
  return STRAPI_URL.replace(/\/$/, '');
}

export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${getStrapiUrl()}${path}`;
}

type FetchOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export class StrapiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'StrapiRequestError';
    this.status = status;
  }
}

export async function strapiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${getStrapiUrl()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? `Request failed (${res.status})`;
    throw new StrapiRequestError(message, res.status);
  }

  return json as T;
}

export async function sendOtp(phone: string) {
  return strapiFetch<{ ok: boolean }>('/api/phone-auth/send-otp', {
    method: 'POST',
    body: { phone },
  });
}

export async function verifyOtp(phone: string, otp: string) {
  return strapiFetch<{ jwt: string; user: import('./types').AuthUser }>('/api/phone-auth/verify', {
    method: 'POST',
    body: { phone, otp },
  });
}

/** Persists the real Strapi password for the authenticated user (enables cross-device login). */
export async function setStrapiPassword(password: string) {
  return strapiFetch<{ ok: boolean }>('/api/phone-auth/set-password', {
    method: 'POST',
    auth: true,
    body: { password },
  });
}

/** Strapi users-permissions local login (identifier = user_{phone}). */
export async function loginWithStrapiLocal(phone: string, password: string) {
  return strapiFetch<{ jwt: string; user: Record<string, unknown> }>('/api/auth/local', {
    method: 'POST',
    body: {
      identifier: `user_${phone}`,
      password,
    },
  });
}
