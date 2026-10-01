import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { AuthSession } from '@/types';

const SESSION_KEY = 'beesky.session';

/**
 * Phiên "không ghi nhớ": trên web lưu ở sessionStorage (còn khi tải lại trang, mất khi đóng tab);
 * trên native giữ trong bộ nhớ (mất khi tắt ứng dụng).
 */
let memorySession: string | null = null;

function webSessionStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.token === 'string' && typeof v.userId === 'string' && typeof v.createdAt === 'string';
}

function parse(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function loadSession(): Promise<AuthSession | null> {
  try {
    const persisted = parse(await AsyncStorage.getItem(SESSION_KEY));
    if (persisted) return persisted;
  } catch {
    // Bỏ qua lỗi đọc bộ nhớ, coi như chưa đăng nhập.
  }
  return parse(webSessionStorage()?.getItem(SESSION_KEY) ?? memorySession);
}

/** `remember = true`: lưu bền (AsyncStorage). `false`: chỉ trong phiên hiện tại. */
export async function saveSession(session: AuthSession, remember: boolean): Promise<void> {
  const raw = JSON.stringify(session);
  await clearSession();
  if (remember) {
    await AsyncStorage.setItem(SESSION_KEY, raw);
    return;
  }
  const web = webSessionStorage();
  if (web) web.setItem(SESSION_KEY, raw);
  else memorySession = raw;
}

export async function clearSession(): Promise<void> {
  memorySession = null;
  webSessionStorage()?.removeItem(SESSION_KEY);
  await AsyncStorage.removeItem(SESSION_KEY);
}
