import { create } from 'zustand';

import { fetchMyProfile } from '@/lib/api';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secureStorage';
import { setAuthToken, verifyOtp } from '@/lib/strapi';
import type { AuthUser } from '@/lib/types';

const TOKEN_KEY = 'ark_jwt';
const USER_KEY = 'ark_user';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (phone: string, otp: string) => Promise<AuthUser>;
  refreshUser: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  needsOnboarding: () => boolean;
};

async function persistUser(user: AuthUser) {
  await setSecureItem(USER_KEY, JSON.stringify(user));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const token = await getSecureItem(TOKEN_KEY);
      const userRaw = await getSecureItem(USER_KEY);
      const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
      setAuthToken(token);
      set({ token, user, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },

  login: async (phone, otp) => {
    set({ isLoading: true });
    try {
      const { jwt, user } = await verifyOtp(phone, otp);
      await setSecureItem(TOKEN_KEY, jwt);
      await persistUser(user);
      setAuthToken(jwt);
      set({ token: jwt, user, isLoading: false });
      return user;
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  refreshUser: async () => {
    const { token } = get();
    if (!token) return null;
    try {
      const res = await fetchMyProfile();
      await persistUser(res.user);
      set({ user: res.user });
      return res.user;
    } catch {
      return get().user;
    }
  },

  setUser: async (user) => {
    await persistUser(user);
    set({ user });
  },

  logout: async () => {
    await deleteSecureItem(TOKEN_KEY);
    await deleteSecureItem(USER_KEY);
    setAuthToken(null);
    set({ token: null, user: null });
  },

  needsOnboarding: () => {
    const user = get().user;
    return Boolean(user && user.onboardingComplete === false);
  },
}));
