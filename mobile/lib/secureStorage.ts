import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PROBE_KEY = '__ark_secure_probe__';

/** Cached after first probe — avoids repeated native calls. */
let backend: 'secure' | 'async' | null = null;

async function resolveBackend(): Promise<'secure' | 'async'> {
  if (backend) return backend;

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    backend = 'async';
    return backend;
  }

  try {
    if (!(await SecureStore.isAvailableAsync())) {
      backend = 'async';
      return backend;
    }
    // isAvailableAsync only checks read; verify write works (web / partial native stubs fail here).
    await SecureStore.setItemAsync(PROBE_KEY, '1');
    await SecureStore.deleteItemAsync(PROBE_KEY);
    backend = 'secure';
  } catch {
    backend = 'async';
  }

  return backend;
}

export async function getSecureItem(key: string): Promise<string | null> {
  const store = await resolveBackend();
  if (store === 'secure') {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      backend = 'async';
    }
  }
  return AsyncStorage.getItem(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  const store = await resolveBackend();
  if (store === 'secure') {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      backend = 'async';
    }
  }
  await AsyncStorage.setItem(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  const store = await resolveBackend();
  if (store === 'secure') {
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch {
      backend = 'async';
    }
  }
  await AsyncStorage.removeItem(key);
}
