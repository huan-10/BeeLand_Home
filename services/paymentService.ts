import { mockContracts } from '@/data/mock/contracts';
import { mockInstallments } from '@/data/mock/installments';
import { toInstallmentView } from '@/lib/payment';
import type { PaymentCheckout, PaymentCheckStatus, PaymentInstallmentView, PayTarget } from '@/types';

import { AUTH_BACKEND } from './config';
import { isNoxhOnlySession, requirePortalToken } from './session';
import { ServiceError } from './errors';
import { simulateLatency } from './mockLatency';
import { getContractBundles } from './supabase/customerDomain';
import { getCheckoutStatus, startCheckout } from './supabase/portalPayment';

export { PaymentBlockedError, type PaymentBlockReason } from './supabase/portalPayment';

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

/** Mock: tài khoản định danh giả; "nhận tiền" sau ~20 giây để thử trọn luồng khi chạy offline. */
const mockCheckouts = new Map<string, { openedAt: number }>();
const MOCK_PAID_AFTER_MS = 20_000;

/**
 * Mở mã QR chuyển khoản cho một khoản (đợt HĐMB / tiền cọc / tiền giữ chỗ) — luồng tài khoản định danh như web
 * (booking / đặt cọc). Máy chủ tự tính số tiền; tiền về → webhook tạo phiếu thu (và tự duyệt booking / đặt cọc).
 */
export async function startPayment(target: Pick<PayTarget, 'contractId' | 'dot' | 'contractCode'>): Promise<PaymentCheckout> {
  if (AUTH_BACKEND === 'api') {
    return startCheckout(requirePortalToken(), target.contractId, target.dot, target.contractCode);
  }
  await simulateLatency();
  const installment = target.dot == null ? null : mockInstallments.find((i) => i.contractId === target.contractId && i.sequence === target.dot);
  const contract = mockContracts.find((c) => c.id === target.contractId);
  if (!contract || !installment) throw new ServiceError('Không tìm thấy đợt thanh toán.', 'NOT_FOUND');
  const vaId = `mock-va-${contract.id}-${installment.sequence}`;
  mockCheckouts.set(vaId, { openedAt: Date.now() });
  return {
    vaId,
    module: 'HOPDONG',
    bankCode: 'BIDV',
    accountNumber: `DA1${String(installment.sequence).padStart(8, '0')}`,
    accountName: 'CONG TY CP BEESKY',
    amount: Math.max(installment.amount - installment.paidAmount, 0),
    content: `Thanh toan ${contract.code} ${installment.name}`,
    expiresAt: null,
    paidAmount: 0,
    label: installment.name,
    contractCode: contract.code,
  };
}

/** Số tiền tài khoản định danh đã nhận — màn QR hỏi lại mỗi 5 giây. */
export async function getPaymentStatus(vaId: string): Promise<PaymentCheckStatus> {
  if (AUTH_BACKEND === 'api') return getCheckoutStatus(requirePortalToken(), vaId);
  const m = mockCheckouts.get(vaId);
  if (!m) throw new ServiceError('Không tìm thấy giao dịch thanh toán.', 'NOT_FOUND');
  return { paidAmount: Date.now() - m.openedAt >= MOCK_PAID_AFTER_MS ? 1 : 0, active: true, approved: false };
}
