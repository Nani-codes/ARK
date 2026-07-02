import { useAuthStore } from '@/stores/auth';

type UseRequireAuthOptions = {
  /** When false, only exposes auth state without auto-redirect. Default true is unused — screens use GuestAuthPrompt instead. */
};

/**
 * Returns auth hydration state for protected screens.
 * Use with GuestAuthPrompt when !token after isHydrated.
 */
export function useRequireAuth(_options?: UseRequireAuthOptions) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);

  return {
    isHydrated,
    isSignedIn: Boolean(token),
    token,
    ready: isHydrated && Boolean(token),
  };
}
