import type { IconName, Tone } from '@/theme';
import type {
  ContractStatus,
  ContractType,
  InstallmentStatus,
  NotificationType,
  PaymentMethod,
} from '@/types';

interface StatusMeta {
  label: string;
  tone: Tone;
}

export const contractTypeLabels: Record<ContractType, { label: string; short: string }> = {
  purchase: { label: 'Hợp đồng mua bán', short: 'HĐMB' },
  deposit: { label: 'Hợp đồng đặt cọc', short: 'HĐĐC' },
  reservation: { label: 'Phiếu giữ chỗ', short: 'PGC' },
};

export const contractStatusMeta: Record<ContractStatus, StatusMeta> = {
  active: { label: 'Đang hiệu lực', tone: 'success' },
  completed: { label: 'Đã tất toán', tone: 'success' },
  pending: { label: 'Chờ xử lý', tone: 'warning' },
  cancelled: { label: 'Đã hủy', tone: 'neutral' },
};

/** Trạng thái đợt thanh toán: luôn có chữ + icon (không chỉ dựa vào màu). */
export const installmentStatusMeta: Record<InstallmentStatus, StatusMeta & { icon: IconName }> = {
  paid: { label: 'Đã thanh toán', tone: 'success', icon: 'checkmark' },
  partial: { label: 'Thanh toán một phần', tone: 'primary', icon: 'hourglass-outline' },
  upcoming: { label: 'Đến hạn', tone: 'primary', icon: 'alarm-outline' },
  overdue: { label: 'Quá hạn', tone: 'danger', icon: 'alert' },
  scheduled: { label: 'Chưa đến hạn', tone: 'neutral', icon: 'time-outline' },
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  bank_transfer: 'Chuyển khoản',
  cash: 'Tiền mặt',
  card: 'Thẻ',
};

export const notificationTypeMeta: Record<NotificationType, { tone: Tone; icon: IconName }> = {
  payment_reminder: { tone: 'primary', icon: 'alarm-outline' },
  payment_overdue: { tone: 'danger', icon: 'alert-circle-outline' },
  receipt: { tone: 'success', icon: 'receipt-outline' },
  contract: { tone: 'info', icon: 'document-text-outline' },
  project: { tone: 'info', icon: 'business-outline' },
};
