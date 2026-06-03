import { create } from 'zustand';

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
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
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
      await setSecureItem(USER_KEY, JSON.stringify(user));
      setAuthToken(jwt);
      set({ token: jwt, user, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    await deleteSecureItem(TOKEN_KEY);
    await deleteSecureItem(USER_KEY);
    setAuthToken(null);
    set({ token: null, user: null });
  },
}));
