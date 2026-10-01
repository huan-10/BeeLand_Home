import type { IconName } from '@/theme';

export interface NavItem {
  /** Tên route trong nhóm `(app)`. */
  name: 'index' | 'contracts' | 'payments' | 'receipts' | 'profile' | 'notifications';
  label: string;
  icon: IconName;
  activeIcon: IconName;
}

/** 5 mục điều hướng chính (bottom tab trên mobile, sidebar trên màn hình rộng). */
export const primaryNavItems: NavItem[] = [
  { name: 'index', label: 'Trang chủ', icon: 'home-outline', activeIcon: 'home' },
  { name: 'contracts', label: 'Hợp đồng', icon: 'document-text-outline', activeIcon: 'document-text' },
  { name: 'payments', label: 'Thanh toán', icon: 'calendar-outline', activeIcon: 'calendar' },
  { name: 'receipts', label: 'Phiếu thu', icon: 'receipt-outline', activeIcon: 'receipt' },
  { name: 'profile', label: 'Cá nhân', icon: 'person-outline', activeIcon: 'person' },
];

/** Mục bổ sung chỉ hiện trên sidebar. */
export const secondaryNavItems: NavItem[] = [
  { name: 'notifications', label: 'Thông báo', icon: 'notifications-outline', activeIcon: 'notifications' },
];
