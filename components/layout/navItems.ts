import type { IconName } from '@/theme';

export interface NavItem {
  /** Tên route trong nhóm `(app)`. */
  name: 'index' | 'contracts' | 'payments' | 'receipts' | 'profile' | 'notifications';
  label: string;
  icon: IconName;
}

/** 5 mục điều hướng chính (bottom tab trên mobile, sidebar trên màn hình rộng). */
export const primaryNavItems: NavItem[] = [
  { name: 'index', label: 'Trang chủ', icon: 'home' },
  { name: 'contracts', label: 'Hợp đồng', icon: 'document' },
  { name: 'payments', label: 'Thanh toán', icon: 'calendar' },
  { name: 'receipts', label: 'Phiếu thu', icon: 'receipt' },
  { name: 'profile', label: 'Cá nhân', icon: 'user' },
];

/** Mục bổ sung chỉ hiện trên sidebar. */
export const secondaryNavItems: NavItem[] = [
  { name: 'notifications', label: 'Thông báo', icon: 'bell' },
];
