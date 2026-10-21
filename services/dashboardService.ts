import { calcPercent, findNextInstallment } from '@/lib/payment';
import type { DashboardSummary } from '@/types';

import { getContracts } from './contractService';
import { getAllInstallments } from './paymentService';

/** Số liệu tổng quan cho màn hình Trang chủ. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /dashboard) — hoặc giữ nguyên
  // vì hàm này chỉ tổng hợp từ các service khác.
  // Không đọc thông báo ở đây: Trang chủ tải thông báo riêng (useLatestNotifications) — lỗi phiếu thu / thông báo
  // không được kéo hỏng khối Thanh toán sắp tới.
  const [contracts, installments] = await Promise.all([getContracts(), getAllInstallments()]);
  // Phiếu đã huỷ / thanh lý không còn tính vào tổng giá trị và tiến độ thanh toán.
  const live = contracts.filter((c) => c.status !== 'cancelled');
  const totalValue = live.reduce((sum, c) => sum + c.totalValue, 0);
  const paidAmount = live.reduce((sum, c) => sum + c.summary.paidAmount, 0);
  return {
    contractCount: contracts.length,
    activeContractCount: contracts.filter((c) => c.status === 'active').length,
    totalValue,
    paidAmount,
    remainingAmount: Math.max(totalValue - paidAmount, 0),
    paidPercent: calcPercent(paidAmount, totalValue),
    nextInstallment: findNextInstallment(installments.filter((i) => i.status !== 'overdue')),
    overdueInstallments: installments.filter((i) => i.status === 'overdue'),
  };
}
