import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { parseRememberedLogin, serializeRememberedLogin, type RememberedLogin } from '@/lib/rememberedLogin';
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
  // `token` vắng khi công ty đang xem chỉ có phiên NOXH (tài khoản tự đăng ký qua website).
  return (typeof v.token === 'string' || v.token === undefined) && typeof v.userId === 'string' && typeof v.createdAt === 'string';
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

/** JWT tài khoản hệ thống mà bản app cũ lưu (`beesky.serviceJwt`, trước 2026-10-08) — xoá khỏi máy, app không còn dùng. */
const LEGACY_SERVICE_JWT_KEY = 'beesky.serviceJwt';

export async function loadSession(): Promise<AuthSession | null> {
  void AsyncStorage.removeItem(LEGACY_SERVICE_JWT_KEY).catch(() => undefined);
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

/** Ghi đè phiên đang lưu (ví dụ khi chuyển công ty), giữ nguyên kiểu lưu bền / tạm thời đã chọn lúc đăng nhập. */
export async function updateSession(session: AuthSession): Promise<void> {
  const remember = await AsyncStorage.getItem(SESSION_KEY)
    .then((raw) => raw !== null)
    .catch(() => false);
  await saveSession(session, remember);
}

export async function clearSession(): Promise<void> {
  memorySession = null;
  webSessionStorage()?.removeItem(SESSION_KEY);
  await AsyncStorage.removeItem(SESSION_KEY);
}

const REMEMBERED_LOGIN_KEY = 'beesky.rememberedLogin';

/** Native: Keychain / Keystore (expo-secure-store, mã hoá). Web: localStorage, KHÔNG có mật khẩu. */
export async function saveRememberedLogin(value: RememberedLogin): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      window.localStorage?.setItem(REMEMBERED_LOGIN_KEY, serializeRememberedLogin(value, false));
      return;
    }
    await SecureStore.setItemAsync(REMEMBERED_LOGIN_KEY, serializeRememberedLogin(value));
  } catch {
    // Không lưu được → lần sau khách tự nhập, không chặn đăng nhập.
  }
}

export async function loadRememberedLogin(): Promise<RememberedLogin | null> {
  try {
    if (Platform.OS === 'web') return parseRememberedLogin(window.localStorage?.getItem(REMEMBERED_LOGIN_KEY));
    return parseRememberedLogin(await SecureStore.getItemAsync(REMEMBERED_LOGIN_KEY));
  } catch {
    return null;
  }
}

/** Bỏ tick "Ghi nhớ" khi đăng nhập → xoá thông tin đã nhớ. */
export async function clearRememberedLogin(): Promise<void> {
  try {
    if (Platform.OS === 'web') window.localStorage?.removeItem(REMEMBERED_LOGIN_KEY);
    else await SecureStore.deleteItemAsync(REMEMBERED_LOGIN_KEY);
  } catch {
    // bỏ qua
  }
}
