import type { AppNotification, PaymentInstallmentView, Receipt } from '@/types';

import { formatCurrency, formatDate } from './format';
import { UPCOMING_WINDOW_DAYS } from './payment';

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

const DAY_MS = 24 * 60 * 60 * 1000;
/** Phiếu thu trong khoảng này được báo "đã ghi nhận thanh toán". */
const RECEIPT_WINDOW_DAYS = 60;

/** Lùi `days` ngày từ một ngày yyyy-MM-dd, trả ISO (dùng làm thời điểm tạo thông báo nhắc trước hạn). */
function shiftDate(date: string, days: number): string {
  return new Date(new Date(`${date}T00:00:00+07:00`).getTime() + days * DAY_MS).toISOString();
}

/**
 * Thông báo của khách tạo từ dữ liệu thật của chính khách (server chưa có bảng thông báo cho khách hàng):
 * - đợt quá hạn → `payment_overdue`; đợt sắp đến hạn / trả một phần → `payment_reminder`;
 * - phiếu thu trong 60 ngày → `receipt`.
 * Không có `read` — service gắn trạng thái đã đọc theo tài khoản.
 */
export function buildPaymentNotifications(
  installments: PaymentInstallmentView[],
  receipts: Receipt[],
  today: Date = new Date(),
): Omit<AppNotification, 'read'>[] {
  const items: Omit<AppNotification, 'read'>[] = [];
  for (const i of installments) {
    const link = `/contracts/${i.contractId}`;
    if (i.status === 'overdue') {
      items.push({
        id: `overdue_${i.id}`,
        type: 'payment_overdue',
        title: `${i.name} đã quá hạn`,
        message: `${i.contractCode} (căn ${i.unitCode}) còn ${formatCurrency(i.remainingAmount)}, hạn ${formatDate(i.dueDate)}.`,
        createdAt: shiftDate(i.dueDate, 1),
        link,
      });
    } else if (i.status === 'upcoming' || (i.status === 'partial' && i.daysUntilDue <= UPCOMING_WINDOW_DAYS)) {
      items.push({
        id: `reminder_${i.id}`,
        type: 'payment_reminder',
        title: `Nhắc lịch thanh toán ${i.name}`,
        message: `${i.name} của ${i.contractCode} (${formatCurrency(i.remainingAmount)}) đến hạn ngày ${formatDate(i.dueDate)}.`,
        createdAt: shiftDate(i.dueDate, -UPCOMING_WINDOW_DAYS),
        link,
      });
    }
  }
  const since = today.getTime() - RECEIPT_WINDOW_DAYS * DAY_MS;
  for (const r of receipts) {
    if (!r.paidDate || new Date(`${r.paidDate}T00:00:00+07:00`).getTime() < since) continue;
    items.push({
      id: `receipt_${r.id}`,
      type: 'receipt',
      title: `Đã ghi nhận thanh toán ${formatCurrency(r.amount)}`,
      message: `Phiếu thu ${r.code} cho ${r.contractCode}${r.content ? ` – ${r.content}` : ''}.`,
      createdAt: new Date(`${r.paidDate}T08:00:00+07:00`).toISOString(),
      link: `/receipts/${r.id}`,
    });
  }
  return items
    .filter((n) => new Date(n.createdAt).getTime() <= today.getTime())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
