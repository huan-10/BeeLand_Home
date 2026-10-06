/**
 * Danh mục chức năng của app + tuỳ chỉnh lưới chức năng ở Trang chủ (thuần, có test `tests/app-modules.test.cjs`).
 * Dùng chung cho mục "Quản lý" ở Cá nhân và màn "Tuỳ chỉnh Trang chủ".
 */
import type { Href } from 'expo-router';

import type { IconName } from '@/theme';

export type AppModuleGroup = 'bds' | 'noxh';

export interface AppModule {
  id: string;
  group: AppModuleGroup;
  /** Tên đầy đủ (danh sách cài đặt, tên truy cập). */
  label: string;
  /** Nhãn trong lưới icon — có thể ngắt dòng bằng `\n` cho cân đối. */
  short: string;
  icon: IconName;
  href: Href;
}

export const APP_MODULE_GROUPS: { id: AppModuleGroup; title: string; icon: IconName }[] = [
  { id: 'bds', title: 'Bất động sản', icon: 'home' },
  { id: 'noxh', title: 'Nhà ở xã hội', icon: 'building' },
];

export const APP_MODULES: AppModule[] = [
  { id: 'contracts', group: 'bds', label: 'Hợp đồng', short: 'Hợp đồng', icon: 'document', href: '/contracts' },
  { id: 'payments', group: 'bds', label: 'Thanh toán', short: 'Thanh toán', icon: 'calendar', href: '/payments' },
  { id: 'receipts', group: 'bds', label: 'Phiếu thu', short: 'Phiếu thu', icon: 'receipt', href: { pathname: '/payments', params: { tab: 'paid' } } },
  { id: 'handover', group: 'bds', label: 'Bàn giao căn hộ', short: 'Bàn giao\ncăn hộ', icon: 'key', href: '/ban-giao' },
  { id: 'handover-schedule', group: 'bds', label: 'Lịch bàn giao', short: 'Lịch\nbàn giao', icon: 'calendarCheck', href: '/lich-ban-giao' },
  { id: 'notifications', group: 'bds', label: 'Thông báo', short: 'Thông báo', icon: 'bell', href: '/notifications' },
  { id: 'noxh', group: 'noxh', label: 'Nhà ở xã hội', short: 'Nhà ở\nxã hội', icon: 'building', href: '/noxh' },
  { id: 'noxh-applications', group: 'noxh', label: 'Hồ sơ nhà ở xã hội', short: 'Hồ sơ\nNOXH', icon: 'idCard', href: '/noxh/ho-so' },
  { id: 'noxh-lottery', group: 'noxh', label: 'Bốc thăm', short: 'Bốc thăm', icon: 'trophy', href: '/noxh/boc-tham' },
  { id: 'noxh-results', group: 'noxh', label: 'Kết quả bốc thăm', short: 'Kết quả\nbốc thăm', icon: 'listChecks', href: '/noxh/ket-qua' },
  { id: 'noxh-guide', group: 'noxh', label: 'Hướng dẫn nhà ở xã hội', short: 'Hướng dẫn', icon: 'book', href: '/noxh/huong-dan' },
];

/** Trang chủ mặc định: 4 chức năng bất động sản. */
export const DEFAULT_HOME_MODULES = ['contracts', 'payments', 'handover', 'handover-schedule'];
/** Tối đa 2 hàng × 4 cột. */
export const HOME_MODULE_MAX = 8;

const BY_ID = new Map(APP_MODULES.map((m) => [m.id, m]));

export function appModule(id: string): AppModule | undefined {
  return BY_ID.get(id);
}

/** Dữ liệu đọc từ máy (có thể cũ / hỏng): bỏ mã lạ, trùng; tối đa 8; rỗng → mặc định. */
export function normalizeHomeModules(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_HOME_MODULES];
  const ids = [...new Set(value.filter((v): v is string => typeof v === 'string' && BY_ID.has(v)))].slice(0, HOME_MODULE_MAX);
  return ids.length ? ids : [...DEFAULT_HOME_MODULES];
}

/** Thêm vào cuối (bỏ qua nếu đã có hoặc đã đủ 8). */
export function addHomeModule(ids: string[], id: string): string[] {
  if (ids.includes(id) || ids.length >= HOME_MODULE_MAX || !BY_ID.has(id)) return ids;
  return [...ids, id];
}

/** Bỏ khỏi Trang chủ (luôn giữ ít nhất 1 chức năng). */
export function removeHomeModule(ids: string[], id: string): string[] {
  if (ids.length <= 1) return ids;
  return ids.filter((x) => x !== id);
}

/** Đổi chỗ với mục liền trước (`-1`) / liền sau (`1`). */
export function moveHomeModule(ids: string[], id: string, dir: -1 | 1): string[] {
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return ids;
  const next = [...ids];
  [next[i], next[j]] = [next[j] as string, next[i] as string];
  return next;
}
