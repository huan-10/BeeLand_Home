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
  completed: { label: 'Đã hoàn tất', tone: 'info' },
  pending: { label: 'Chờ xử lý', tone: 'warning' },
  cancelled: { label: 'Đã hủy', tone: 'neutral' },
};

export const installmentStatusMeta: Record<InstallmentStatus, StatusMeta> = {
  paid: { label: 'Đã thanh toán', tone: 'success' },
  partial: { label: 'Thanh toán một phần', tone: 'info' },
  upcoming: { label: 'Sắp đến hạn', tone: 'primary' },
  overdue: { label: 'Quá hạn', tone: 'danger' },
  scheduled: { label: 'Chưa đến hạn', tone: 'neutral' },
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
