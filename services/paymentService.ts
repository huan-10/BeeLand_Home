import { mockContracts } from '@/data/mock/contracts';
import { mockInstallments } from '@/data/mock/installments';
import { toInstallmentView } from '@/lib/payment';
import type { PaymentInstallmentView } from '@/types';

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
