import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_HOME_MODULES, normalizeHomeModules } from '@/lib/appModules';

/**
 * Chức năng hiển thị ở Trang chủ — lưu TRÊN MÁY theo từng tài khoản đăng nhập (database chỉ đọc, không có bảng cài đặt).
 * Store nhỏ có lắng nghe: sửa ở "Tuỳ chỉnh Trang chủ" → Trang chủ cập nhật ngay.
 */
const keyOf = (accountId: string) => `beesky.home-modules.${accountId}`;

const cache = new Map<string, string[]>();
const listeners = new Set<(accountId: string, ids: string[]) => void>();

export function onHomeModulesChange(fn: (accountId: string, ids: string[]) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function loadHomeModules(accountId: string): Promise<string[]> {
  const hit = cache.get(accountId);
  if (hit) return hit;
  let ids = [...DEFAULT_HOME_MODULES];
  try {
    const raw = await AsyncStorage.getItem(keyOf(accountId));
    ids = normalizeHomeModules(raw ? JSON.parse(raw) : null);
  } catch {
    // Dữ liệu hỏng / không đọc được → mặc định.
  }
  cache.set(accountId, ids);
  return ids;
}

export async function saveHomeModules(accountId: string, ids: string[]): Promise<void> {
  const next = normalizeHomeModules(ids);
  cache.set(accountId, next);
  listeners.forEach((fn) => fn(accountId, next));
  await AsyncStorage.setItem(keyOf(accountId), JSON.stringify(next)).catch(() => undefined);
}
