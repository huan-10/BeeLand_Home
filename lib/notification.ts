import type { AppNotification } from '@/types';

export function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

/** Cụm từ đầy đủ cho trình đọc màn hình (skill: không đọc số trần). */
export function unreadLabel(count: number): string {
  return count === 0 ? 'không có thông báo mới' : `${count} thông báo chưa đọc`;
}

export function latestNotifications(notifications: AppNotification[], limit: number): AppNotification[] {
  return [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}
