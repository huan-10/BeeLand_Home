import type { IconName } from '@/theme';

export interface NavItem {
  /** Tên route trong nhóm `(app)`. */
  name: 'index' | 'contracts' | 'noxh' | 'payments' | 'profile' | 'notifications';
  label: string;
  /** Nhãn đầy đủ trên sidebar (màn rộng) khi khác nhãn ngắn của thanh tab. */
  sidebarLabel?: string;
  icon: IconName;
}

/**
 * 5 mục điều hướng chính (bottom tab trên mobile, sidebar trên màn hình rộng).
 * Nhà ở xã hội nằm giữa; Phiếu thu không còn tab riêng — mở từ thanh phân đoạn trong Thanh toán.
 */
export const primaryNavItems: NavItem[] = [
  { name: 'index', label: 'Trang chủ', icon: 'home' },
  { name: 'contracts', label: 'Hợp đồng', icon: 'document' },
  { name: 'noxh', label: 'Nhà ở XH', sidebarLabel: 'Nhà ở xã hội', icon: 'building' },
  { name: 'payments', label: 'Thanh toán', icon: 'calendar' },
  { name: 'profile', label: 'Cá nhân', icon: 'user' },
];

/** Mục bổ sung chỉ hiện trên sidebar. */
export const secondaryNavItems: NavItem[] = [
  { name: 'notifications', label: 'Thông báo', icon: 'bell' },
];

/** Route con được tô sáng theo một tab chính. */
const ALIASES: Record<string, NavItem['name']> = { receipts: 'payments', 'tuy-chinh-trang-chu': 'profile' };

/** Tab/mục sidebar đang chọn ứng với route hiện tại; route không thuộc tab nào → `undefined`. */
export function activeNavName(routeName: string | undefined): NavItem['name'] | undefined {
  if (!routeName) return undefined;
  if (ALIASES[routeName]) return ALIASES[routeName];
  return [...primaryNavItems, ...secondaryNavItems].find((i) => i.name === routeName)?.name;
}
