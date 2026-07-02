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

/**
 * Invoked when an authenticated request is rejected by the server with 401.
 * Registered by the auth store to clear a stale/expired session so route
 * guards fall back to the signed-out state instead of trusting a dead token.
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
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

  if (auth && !authToken) {
    throw new StrapiRequestError('Authentication required', 401);
  }

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
    if (res.status === 401 && auth) {
      onUnauthorized?.();
    }
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
