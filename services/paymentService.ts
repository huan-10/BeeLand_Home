import { mockContracts } from '@/data/mock/contracts';
import { mockInstallments } from '@/data/mock/installments';
import { toInstallmentView } from '@/lib/payment';
import type { PaymentInstallmentView, PaymentIntent } from '@/types';

import { ServiceError } from './errors';
import { simulateLatency } from './mockLatency';

/** Lịch thanh toán của một hợp đồng, sắp theo thứ tự đợt. */
export async function getInstallments(contractId: string): Promise<PaymentInstallmentView[]> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /contracts/:id/installments)
  await simulateLatency();
  const contract = mockContracts.find((c) => c.id === contractId);
  if (!contract) throw new ServiceError('Không tìm thấy hợp đồng.', 'NOT_FOUND');
  return mockInstallments
    .filter((i) => i.contractId === contractId)
    .sort((a, b) => a.sequence - b.sequence)
    .map((i) => toInstallmentView(i, contract));
}

/** Toàn bộ các đợt thanh toán của khách hàng trên mọi hợp đồng. */
export async function getAllInstallments(): Promise<PaymentInstallmentView[]> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /installments?customerId=)
  await simulateLatency();
  return mockInstallments.flatMap((installment) => {
    const contract = mockContracts.find((c) => c.id === installment.contractId);
    return contract ? [toInstallmentView(installment, contract)] : [];
  });
}

/**
 * Khởi tạo thanh toán cho một đợt của hợp đồng.
 * TODO: thay bằng gọi API/database thật — tạo giao dịch ở cổng thanh toán (VNPay/MoMo/ngân hàng)
 * rồi trả về `{ status: 'redirect', checkoutUrl }` để mở trang thanh toán.
 */
export async function startPayment(contractId: string, installmentId: string): Promise<PaymentIntent> {
  await simulateLatency();
  const installment = mockInstallments.find((i) => i.id === installmentId && i.contractId === contractId);
  if (!installment) throw new ServiceError('Không tìm thấy đợt thanh toán.', 'NOT_FOUND');
  return {
    status: 'unavailable',
    message: 'Cổng thanh toán trực tuyến đang được tích hợp. Vui lòng chuyển khoản theo hướng dẫn trong hợp đồng.',
  };
}
