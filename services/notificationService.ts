import { mockNotifications } from '@/data/mock/notifications';
import type { AppNotification } from '@/types';

import { clone, simulateLatency } from './mockLatency';

/** Trạng thái đã đọc chỉ lưu trong bộ nhớ khi dùng dữ liệu mock. */
const readIds = new Set<string>();

function withReadState(notification: AppNotification): AppNotification {
  return { ...clone(notification), read: notification.read || readIds.has(notification.id) };
}

export async function getNotifications(): Promise<AppNotification[]> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /notifications)
  await simulateLatency();
  return mockNotifications
    .map(withReadState)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationRead(id: string): Promise<void> {
  // TODO: thay bằng gọi API/database thật (ví dụ PATCH /notifications/:id { read: true })
  await simulateLatency(150, 300);
  readIds.add(id);
}

export async function markAllNotificationsRead(): Promise<void> {
  // TODO: thay bằng gọi API/database thật (ví dụ POST /notifications/read-all)
  await simulateLatency(150, 300);
  mockNotifications.forEach((n) => readIds.add(n.id));
}
