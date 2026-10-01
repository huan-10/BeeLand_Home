import { calcPercent, findNextInstallment } from '@/lib/payment';
import type { DashboardSummary } from '@/types';

import { getContracts } from './contractService';
import { getNotifications } from './notificationService';
import { getAllInstallments } from './paymentService';

/** Số liệu tổng quan cho màn hình Trang chủ. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /dashboard) — hoặc giữ nguyên
  // vì hàm này chỉ tổng hợp từ các service khác.
  const [contracts, installments, notifications] = await Promise.all([
    getContracts(),
    getAllInstallments(),
    getNotifications(),
  ]);
  const totalValue = contracts.reduce((sum, c) => sum + c.totalValue, 0);
  const paidAmount = contracts.reduce((sum, c) => sum + c.summary.paidAmount, 0);
  return {
    contractCount: contracts.length,
    activeContractCount: contracts.filter((c) => c.status === 'active').length,
    totalValue,
    paidAmount,
    remainingAmount: Math.max(totalValue - paidAmount, 0),
    paidPercent: calcPercent(paidAmount, totalValue),
    nextInstallment: findNextInstallment(installments.filter((i) => i.status !== 'overdue')),
    overdueInstallments: installments.filter((i) => i.status === 'overdue'),
    unreadNotificationCount: notifications.filter((n) => !n.read).length,
    latestNotifications: notifications.slice(0, 3),
  };
}
