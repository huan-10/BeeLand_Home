import type { Contract, PaymentCheckout, PaymentCheckStatus, PaymentInstallmentView, PayTarget } from '@/types';

import { formatCurrency, formatDate, formatDaysLeft } from './format';

/** Mã trạng thái phiếu (`cloud_catalogs pgc_trang_thai`) đang chờ khách thanh toán: giữ chỗ 1, đặt cọc 8. */
const PENDING_RESERVATION = '1';
const PENDING_DEPOSIT = '8';
/** HĐ đã thanh lý / chờ thanh lý / huỷ — không thanh toán tiếp. */
const CLOSED_CODES = new Set(['11', '12', '16']);

type ContractRef = Pick<Contract, 'id' | 'code' | 'unitCode' | 'projectName'>;

const ref = (c: ContractRef) => ({ contractId: c.id, contractCode: c.code, unitCode: c.unitCode, projectName: c.projectName });

/** Đợt HĐMB cần trả → khoản thanh toán (số đợt gửi lên máy chủ). */
export function installmentPayTarget(contract: ContractRef, i: PaymentInstallmentView): PayTarget {
  return {
    ...ref(contract),
    module: 'HOPDONG',
    dot: i.sequence,
    name: i.name,
    amount: i.remainingAmount,
    dueDate: i.dueDate,
    daysUntilDue: i.daysUntilDue,
  };
}

export interface RecordPayInput {
  contract: ContractRef;
  /** `cloud_pgc_phieu_giucho.giai_doan`. */
  stage: string | null;
  /** `item_code` trạng thái phiếu. */
  statusCode: string | null;
  depositAmount: number;
  paidAmount: number;
  /** Booking mới nhất của phiếu giữ chỗ (`cloud_bookings`). */
  booking?: { amount: number; expiresAt: string | null } | null;
  nextInstallment: PaymentInstallmentView | null;
}

/**
 * Khoản khách trả được ngay trên một phiếu — cùng quy tắc với máy chủ (`fn_portal_payment_target`):
 * HĐMB/HĐGV chưa thanh lý → đợt kế tiếp; đặt cọc chờ duyệt (8) → tiền cọc còn thiếu; giữ chỗ chờ duyệt (1) → tiền giữ chỗ (còn hạn).
 */
export function recordPayTarget(input: RecordPayInput, now: Date = new Date()): PayTarget | null {
  const { contract, stage, statusCode } = input;
  const code = statusCode ?? '';
  if (stage === 'HDMB' || stage === 'HDGV') {
    if (CLOSED_CODES.has(code) || !input.nextInstallment || input.nextInstallment.remainingAmount <= 0) return null;
    return installmentPayTarget(contract, input.nextInstallment);
  }
  if (stage === 'DATCOC' && code === PENDING_DEPOSIT) {
    const amount = Math.max(input.depositAmount - input.paidAmount, 0);
    return amount > 0 ? { ...ref(contract), module: 'DATCOC', dot: null, name: 'Tiền đặt cọc', amount } : null;
  }
  if (stage === 'GIUCHO' && code === PENDING_RESERVATION && input.booking && input.booking.amount > 0) {
    const exp = input.booking.expiresAt;
    if (exp && Date.parse(exp) <= now.getTime()) return null;
    if (input.paidAmount >= input.booking.amount) return null;
    return { ...ref(contract), module: 'BOOKING', dot: null, name: 'Tiền giữ chỗ', amount: input.booking.amount, expiresAt: exp ?? undefined };
  }
  return null;
}

/** Ảnh VietQR (như web `BookingVAQRDialog.vietQrUrl`): ngân hàng + số tài khoản định danh + số tiền + nội dung. */
export function vietQrUrl(c: Pick<PaymentCheckout, 'bankCode' | 'accountNumber' | 'amount' | 'content' | 'accountName'>): string {
  return (
    `https://img.vietqr.io/image/${encodeURIComponent(c.bankCode)}-${encodeURIComponent(c.accountNumber)}-compact2.png` +
    `?amount=${Math.round(c.amount)}&addInfo=${encodeURIComponent(c.content)}&accountName=${encodeURIComponent(c.accountName)}`
  );
}

/** Đã nhận thêm tiền kể từ lúc mở mã QR. */
export function checkoutPaid(checkout: Pick<PaymentCheckout, 'paidAmount'>, status: Pick<PaymentCheckStatus, 'paidAmount'>): boolean {
  return status.paidAmount > checkout.paidAmount;
}

/** Số giây còn lại tới hạn (giữ chỗ); không có hạn → null. */
export function secondsLeft(expiresAt: string | null | undefined, now: number = Date.now()): number | null {
  if (!expiresAt) return null;
  const t = Date.parse(expiresAt);
  return Number.isFinite(t) ? Math.max(0, Math.floor((t - now) / 1000)) : null;
}

/** "mm:ss" (hoặc "h:mm:ss" khi ≥ 1 giờ). */
export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Thông tin chuyển khoản dạng chữ để sao chép / chia sẻ. */
export function transferText(c: PaymentCheckout): string {
  return [
    `Thanh toán ${c.label} – ${c.contractCode}`,
    `Ngân hàng: ${c.bankCode}`,
    `Số tài khoản: ${c.accountNumber}`,
    `Chủ tài khoản: ${c.accountName}`,
    `Số tiền: ${formatCurrency(c.amount)}`,
    `Nội dung: ${c.content}`,
  ].join('\n');
}

/** Hạn hiển thị: đợt → "Còn N ngày / Quá hạn N ngày"; giữ chỗ → "Giữ chỗ tới hh:mm dd/MM/yyyy" (giờ máy); đặt cọc → null. */
export function payTargetDeadline(target: Pick<PayTarget, 'daysUntilDue' | 'expiresAt'>): string | null {
  if (target.daysUntilDue != null) return formatDaysLeft(target.daysUntilDue);
  if (!target.expiresAt) return null;
  const d = new Date(target.expiresAt);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `Giữ chỗ tới ${pad(d.getHours())}:${pad(d.getMinutes())} ${formatDate(day)}`;
}
