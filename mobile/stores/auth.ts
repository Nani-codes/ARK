import { create } from 'zustand';

import { fetchMyProfile } from '@/lib/api';
import { mapStrapiAuthUser } from '@/lib/auth-mapper';
import {
  isAppLocked,
  savePassword,
  SessionExpiredError,
  setAppLocked,
  verifyPassword,
} from '@/lib/credentials';
import { getSecureItem, setSecureItem } from '@/lib/secureStorage';
import { loginWithStrapiLocal, setAuthToken, verifyOtp } from '@/lib/strapi';
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
  loginWithPassword: (phone: string, password: string) => Promise<AuthUser>;
  refreshUser: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  needsOnboarding: () => boolean;
};

async function persistUser(user: AuthUser) {
  await setSecureItem(USER_KEY, JSON.stringify(user));
}

async function establishSession(jwt: string, user: AuthUser) {
  await setSecureItem(TOKEN_KEY, jwt);
  await persistUser(user);
  setAuthToken(jwt);
  await setAppLocked(false);
}

function samePhoneUser(user: AuthUser, phone: string): boolean {
  return user.phone === phone || user.username === `user_${phone}`;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const locked = await isAppLocked();
      if (locked) {
        setAuthToken(null);
        set({ token: null, user: null, isHydrated: true });
        return;
      }

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
      await establishSession(jwt, user);
      set({ token: jwt, user, isLoading: false });
      return user;
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  loginWithPassword: async (phone, password) => {
    set({ isLoading: true });
    try {
      const localOk = await verifyPassword(phone, password);

      if (localOk) {
        const token = await getSecureItem(TOKEN_KEY);
        const userRaw = await getSecureItem(USER_KEY);
        if (!token || !userRaw) {
          throw new SessionExpiredError(phone);
        }

        const storedUser = JSON.parse(userRaw) as AuthUser;
        if (!samePhoneUser(storedUser, phone)) {
          throw new Error('Incorrect phone number or password');
        }

        await establishSession(token, storedUser);
        set({ token, user: storedUser, isLoading: false });
        void get().refreshUser();
        return storedUser;
      }

      try {
        const { jwt, user: rawUser } = await loginWithStrapiLocal(phone, password);
        const user = mapStrapiAuthUser(rawUser, phone);
        await savePassword(phone, password);
        await establishSession(jwt, user);
        set({ token: jwt, user, isLoading: false });
        return user;
      } catch {
        throw new Error('Incorrect phone number or password');
      }
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

  /** Locks the app but keeps the session on device so password sign-in works without OTP. */
  logout: async () => {
    await setAppLocked(true);
    setAuthToken(null);
    set({ token: null, user: null });
  },

  needsOnboarding: () => {
    const user = get().user;
    return Boolean(user && user.onboardingComplete === false);
  },
}));
