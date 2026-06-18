import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secureStorage';

const PWD_PREFIX = 'ark_pwd_';
const LAST_PHONE_KEY = 'ark_last_phone';
const LOCKED_KEY = 'ark_locked';

export class SessionExpiredError extends Error {
  phone: string;

  constructor(phone: string) {
    super('Session expired — verify with OTP to continue');
    this.name = 'SessionExpiredError';
    this.phone = phone;
  }
}

export async function savePassword(phone: string, password: string): Promise<void> {
  await setSecureItem(`${PWD_PREFIX}${phone}`, password);
  await setSecureItem(LAST_PHONE_KEY, phone);
}

export async function verifyPassword(phone: string, password: string): Promise<boolean> {
  const stored = await getSecureItem(`${PWD_PREFIX}${phone}`);
  return stored === password;
}

export async function hasPassword(phone: string): Promise<boolean> {
  const stored = await getSecureItem(`${PWD_PREFIX}${phone}`);
  return Boolean(stored);
}

export async function clearPassword(phone: string): Promise<void> {
  await deleteSecureItem(`${PWD_PREFIX}${phone}`);
}

export async function getLastPhone(): Promise<string | null> {
  return getSecureItem(LAST_PHONE_KEY);
}

export async function setAppLocked(locked: boolean): Promise<void> {
  if (locked) {
    await setSecureItem(LOCKED_KEY, '1');
  } else {
    await deleteSecureItem(LOCKED_KEY);
  }
}

export async function isAppLocked(): Promise<boolean> {
  return (await getSecureItem(LOCKED_KEY)) === '1';
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}
