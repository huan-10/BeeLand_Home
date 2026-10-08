import type { PaymentCheckout, PaymentCheckStatus, PaymentModule } from '@/types';

import { ServiceError } from '../errors';
import { edge, rpc, str } from './client';

/**
 * Thanh toán QR theo token phiên của KHÁCH (beeland/supabase/migrations/20261009160100_portal_payment.sql + edge `portal-payment`):
 *  - `start`: máy chủ kiểm phiếu thuộc khách, TỰ TÍNH số tiền / hạn, dùng lại hoặc tạo tài khoản định danh (VA) như web.
 *  - `fn_portal_payment_status`: số tiền VA đã nhận (webhook ngân hàng cộng vào) — hỏi lại mỗi 5 giây.
 * App không gửi số tiền lên máy chủ. Webhook có sẵn tạo phiếu thu + tự duyệt booking / đặt cọc.
 */

export const PAYMENT_NOT_ENABLED = 'Thanh toán trực tuyến chưa được bật trên máy chủ. Vui lòng liên hệ chủ đầu tư.';

/** Máy chủ chưa có hàm / edge (chưa áp 20261009160100_portal_payment) → thông báo dễ hiểu thay cho lỗi kỹ thuật. */
export function paymentErrorMessage(message: string): string {
  return /could not find the function|schema cache|InvalidWorkerCreation|worker boot error|Function not found|PGRST202|404/i.test(message)
    ? PAYMENT_NOT_ENABLED
    : message;
}

/**
 * Máy chủ chặn theo nghiệp vụ (không phải lỗi kỹ thuật) — màn QR hiện thông báo, không "Thử lại":
 * `NO_PAYMENT_ACCOUNT` dự án chưa có tài khoản nhận thanh toán; `WAIT_FOR_STAFF` dự án có nhiều tài khoản cấu hình,
 * hợp đồng chưa có tài khoản định danh → chờ ban quản lý tạo.
 */
export type PaymentBlockReason = 'NO_PAYMENT_ACCOUNT' | 'WAIT_FOR_STAFF';

export class PaymentBlockedError extends ServiceError {
  constructor(
    message: string,
    public readonly reason: PaymentBlockReason,
  ) {
    super(message, 'CONFLICT');
    this.name = 'PaymentBlockedError';
  }
}

const BLOCK_REASONS: PaymentBlockReason[] = ['NO_PAYMENT_ACCOUNT', 'WAIT_FOR_STAFF'];

const MODULES: PaymentModule[] = ['HOPDONG', 'DATCOC', 'BOOKING'];
const asModule = (v: unknown): PaymentModule => (MODULES.includes(v as PaymentModule) ? (v as PaymentModule) : 'HOPDONG');
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const obj = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {});

async function guard<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof ServiceError) {
      if (e.code === 'NETWORK' || e instanceof PaymentBlockedError) throw e;
      const msg = paymentErrorMessage(e.message);
      throw new ServiceError(msg, /hết hạn/i.test(msg) ? 'UNAUTHORIZED' : e.code);
    }
    throw new ServiceError(PAYMENT_NOT_ENABLED);
  }
}

/** Mở mã QR cho một khoản: `dot` = số đợt (HĐMB), null với đặt cọc / giữ chỗ. */
export function startCheckout(token: string, pgcId: string, dot: number | null, contractCode: string): Promise<PaymentCheckout> {
  return guard(async () => {
    const res = obj(await edge<unknown>('portal-payment', { action: 'start', token, pgc_id: pgcId, dot }));
    const error = str(res.error);
    const code = str(res.code) as PaymentBlockReason;
    if (error && BLOCK_REASONS.includes(code)) throw new PaymentBlockedError(error, code);
    if (error) throw new ServiceError(paymentErrorMessage(error), /hết hạn/i.test(error) ? 'UNAUTHORIZED' : 'UNKNOWN');
    const data = obj(res.data);
    const va = obj(data.va);
    const target = obj(data.target);
    if (!str(va.id) || !str(va.account_number)) throw new ServiceError('Không tạo được mã thanh toán, vui lòng thử lại sau.');
    return {
      vaId: str(va.id),
      module: asModule(va.module ?? target.module),
      bankCode: str(va.bank_code),
      accountNumber: str(va.account_number),
      accountName: str(va.account_name),
      amount: num(va.amount),
      content: str(va.content),
      expiresAt: str(va.expires_at) || str(target.expires_at) || null,
      paidAmount: num(va.paid_amount),
      label: str(target.label) || 'Thanh toán',
      contractCode: str(target.so_phieu) || contractCode,
    };
  });
}

export function getCheckoutStatus(token: string, vaId: string): Promise<PaymentCheckStatus> {
  return guard(async () => {
    const res = obj(await rpc<unknown>('fn_portal_payment_status', { p_token: token, p_va_id: vaId }));
    return { paidAmount: num(res.paid_amount), active: str(res.status) !== 'DELETED', approved: res.approved === true };
  });
}
