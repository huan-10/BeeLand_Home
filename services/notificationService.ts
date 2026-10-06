import AsyncStorage from '@react-native-async-storage/async-storage';

import { mockNotifications } from '@/data/mock/notifications';
import { buildPaymentNotifications } from '@/lib/notification';
import { noxhNotificationId, noxhToAppNotification } from '@/lib/noxh';
import type { AppNotification } from '@/types';

import { AUTH_BACKEND, NOXH_BACKEND } from './config';
import { clone, simulateLatency } from './mockLatency';
import { getAllInstallments } from './paymentService';
import { getNoxhNotifications, markNoxhNotificationsRead } from './noxhService';
import { isNoxhOnlySession, requireCustomerScope } from './session';
import { getCustomerReceipts } from './supabase/customerDomain';

/* ---------------- mock ---------------- */

/** Trạng thái đã đọc chỉ lưu trong bộ nhớ khi dùng dữ liệu mock. */
const readIds = new Set<string>();

function withReadState(notification: AppNotification): AppNotification {
  return { ...clone(notification), read: notification.read || readIds.has(notification.id) };
}

/* ---------------- dữ liệu thật ---------------- */

/** Đã đọc lưu trên máy theo tài khoản cổng khách hàng (server chưa có bảng thông báo cho khách). */
const readKey = () => `beesky.notifications.read.${requireCustomerScope().accountId}`;

async function loadReadIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(readKey());
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

async function saveReadIds(ids: Set<string>): Promise<void> {
  // Giữ tối đa 500 id gần nhất.
  await AsyncStorage.setItem(readKey(), JSON.stringify([...ids].slice(-500))).catch(() => undefined);
}

async function buildRealNotifications(): Promise<AppNotification[]> {
  // Công ty chỉ có phiên NOXH → không có lịch thanh toán / phiếu thu.
  if (isNoxhOnlySession()) return [];
  const [installments, receipts, read] = await Promise.all([getAllInstallments(), getCustomerReceipts(''), loadReadIds()]);
  return buildPaymentNotifications(installments, receipts).map((n) => ({ ...n, read: read.has(n.id) }));
}

/**
 * Thông báo Nhà ở xã hội (lịch / kết quả / huỷ bốc thăm) của mọi công ty đã kết nối. Lỗi → bỏ qua, không làm hỏng danh sách.
 * Khi NOXH chạy API thật mà chưa được ghi "đã đọc" lên server, trạng thái đã đọc lưu trên máy như thông báo thanh toán.
 */
async function buildNoxhNotifications(): Promise<AppNotification[]> {
  try {
    const items = (await getNoxhNotifications()).map(noxhToAppNotification);
    if (NOXH_BACKEND === 'mock') return items;
    const read = await loadReadIds();
    return items.map((n) => ({ ...n, read: n.read || read.has(n.id) }));
  } catch {
    return [];
  }
}

/* ---------------- public ---------------- */

/** Thông báo của khách đang đăng nhập: nhắc / quá hạn thanh toán, phiếu thu mới — chỉ từ dữ liệu của chính khách. */
export async function getNotifications(): Promise<AppNotification[]> {
  const noxh = buildNoxhNotifications();
  let payment: AppNotification[];
  if (AUTH_BACKEND === 'api') payment = await buildRealNotifications();
  else {
    await simulateLatency();
    payment = isNoxhOnlySession() ? [] : mockNotifications.map(withReadState);
  }
  return [...payment, ...(await noxh)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationRead(id: string): Promise<void> {
  const noxhId = noxhNotificationId(id);
  if (noxhId) {
    // Thông báo NOXH: ghi đã đọc lên máy chủ (fn_portal_noxh_thong_bao_da_doc); lỗi → vẫn nhớ trên máy.
    try {
      return await markNoxhNotificationsRead([noxhId]);
    } catch {
      if (NOXH_BACKEND === 'mock') return;
    }
  }
  if (AUTH_BACKEND === 'api' || noxhId) {
    const read = await loadReadIds();
    read.add(id);
    await saveReadIds(read);
    return;
  }
  await simulateLatency(150, 300);
  readIds.add(id);
}

export async function markAllNotificationsRead(): Promise<void> {
  const serverNoxh = await markNoxhNotificationsRead(null).then(
    () => true,
    () => false,
  );
  if (AUTH_BACKEND === 'api') {
    const [items, noxh, read] = await Promise.all([buildRealNotifications(), serverNoxh ? [] : buildNoxhNotifications(), loadReadIds()]);
    noxh.forEach((n) => read.add(n.id));
    items.forEach((n) => read.add(n.id));
    await saveReadIds(read);
    return;
  }
  await simulateLatency(150, 300);
  mockNotifications.forEach((n) => readIds.add(n.id));
}
