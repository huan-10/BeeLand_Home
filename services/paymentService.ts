import { mockContracts } from '@/data/mock/contracts';
import { mockInstallments } from '@/data/mock/installments';
import { toInstallmentView } from '@/lib/payment';
import type { PaymentInstallmentView, PaymentIntent } from '@/types';

import { AUTH_BACKEND } from './config';
import { isNoxhOnlySession } from './session';
import { ServiceError } from './errors';
import { simulateLatency } from './mockLatency';
import { getContractBundles } from './supabase/customerDomain';

/** Lịch thanh toán của một hợp đồng, sắp theo thứ tự đợt. */
export async function getInstallments(contractId: string): Promise<PaymentInstallmentView[]> {
  if (isNoxhOnlySession()) throw new ServiceError('Không tìm thấy hợp đồng.', 'NOT_FOUND');
  if (AUTH_BACKEND === 'api') {
    const bundle = (await getContractBundles()).find((b) => b.contract.id === contractId);
    if (!bundle) throw new ServiceError('Không tìm thấy hợp đồng.', 'NOT_FOUND');
    return bundle.installments;
  }
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
  if (isNoxhOnlySession()) return [];
  if (AUTH_BACKEND === 'api') {
    // Phiếu đã huỷ / thanh lý không còn nghĩa vụ thanh toán.
    return (await getContractBundles()).filter((b) => b.contract.status !== 'cancelled').flatMap((b) => b.installments);
  }
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
  if (AUTH_BACKEND === 'api') {
    const installments = await getInstallments(contractId);
    if (!installments.some((i) => i.id === installmentId)) throw new ServiceError('Không tìm thấy đợt thanh toán.', 'NOT_FOUND');
    return {
      status: 'unavailable',
      message: 'Thanh toán trực tuyến đang được tích hợp. Vui lòng chuyển khoản theo hướng dẫn trong hợp đồng.',
    };
  }
  await simulateLatency();
  const installment = mockInstallments.find((i) => i.id === installmentId && i.contractId === contractId);
  if (!installment) throw new ServiceError('Không tìm thấy đợt thanh toán.', 'NOT_FOUND');
  return {
    status: 'unavailable',
    message: 'Cổng thanh toán trực tuyến đang được tích hợp. Vui lòng chuyển khoản theo hướng dẫn trong hợp đồng.',
  };
}
