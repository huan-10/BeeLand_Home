import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthSession } from '@/types';

const SESSION_KEY = 'beesky.session';

function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.token === 'string' && typeof v.userId === 'string' && typeof v.createdAt === 'string';
}

export async function loadSession(): Promise<AuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
