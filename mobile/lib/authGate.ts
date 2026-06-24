import { router } from 'expo-router';

import { useAuthStore } from '@/stores/auth';
import type { AuthUser } from '@/lib/types';

export function isSignedIn(): boolean {
  return Boolean(useAuthStore.getState().token);
}

export function isSafeReturnTo(path?: string | null): path is string {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('/(auth)/')) return false;
  return true;
}

export function promptAuth(options?: {
  returnTo?: string;
  title?: string;
  message?: string;
}): void {
  const returnTo = isSafeReturnTo(options?.returnTo) ? options.returnTo : undefined;
  router.push({
    pathname: '/(auth)/login' as never,
    params: {
      ...(returnTo ? { returnTo } : {}),
      ...(options?.title ? { title: options.title } : {}),
      ...(options?.message ? { message: options.message } : {}),
    },
  });
}

export function routeAfterAuth(user: AuthUser, returnTo?: string | null): void {
  if (user.onboardingComplete === false) {
    router.replace({
      pathname: '/(auth)/professional-setup' as never,
      params: returnTo && isSafeReturnTo(returnTo) ? { returnTo } : {},
    });
    return;
  }

  if (isSafeReturnTo(returnTo)) {
    router.replace(returnTo as never);
    return;
  }

  router.replace('/(tabs)' as never);
}

export function authParamsWithReturnTo(returnTo?: string | null): { returnTo?: string } {
  return returnTo && isSafeReturnTo(returnTo) ? { returnTo } : {};
}
