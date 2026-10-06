import type { User } from '@/types';

/** Tài khoản demo (đăng nhập bằng số điện thoại). Mật khẩu chỉ dùng cho đăng nhập giả lập. */
export const DEMO_CREDENTIALS = {
  phone: '0901 234 567',
  password: '123456',
} as const;

/** OTP giả lập — giống edge function `portal-auth` (tạm cố định, chưa gửi Zalo). */
export const MOCK_OTP = '8888';

export const MOCK_COMPANIES = {
  sunshine: { companyId: 'company-sunshine', companyName: 'Sunshine Group' },
  bluesky: { companyId: 'company-bluesky', companyName: 'BlueSky Land' },
} as const;

/** Hồ sơ khách hàng (bảng cloud_customers) kèm công ty. */
export type MockCustomerRecord = Omit<User, 'id'> & { companyId: string; companyName: string };

/** Khách hàng đã có tài khoản app (cloud_portal_accounts). */
export const mockUsers: (User & { companyId: string })[] = [
  {
    id: 'user-001',
    customerCode: 'KH-000128',
    fullName: 'Nguyễn Văn An',
    email: 'demo@beesky.vn',
    phone: DEMO_CREDENTIALS.phone,
    idNumber: '079 090 001 234',
    address: '125 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh',
    ...MOCK_COMPANIES.sunshine,
  },
];

/**
 * Hồ sơ khách hàng đã có trong hệ thống (đã ký hợp đồng) nhưng chưa có tài khoản app.
 * - `0912 345 678` là khách của 2 công ty → sau khi đăng ký, đăng nhập phải chọn công ty.
 * - Tài khoản demo còn là khách của BlueSky Land (hồ sơ thêm sau khi đã có tài khoản) → đăng nhập tự liên kết, rồi chọn công ty.
 */
export const mockCustomerRecords: MockCustomerRecord[] = [
  {
    customerCode: 'BS-000207',
    fullName: 'Nguyễn Văn An',
    email: 'demo@beesky.vn',
    phone: DEMO_CREDENTIALS.phone,
    idNumber: '079 090 001 234',
    address: '125 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh',
    ...MOCK_COMPANIES.bluesky,
  },
  {
    customerCode: 'KH-000214',
    fullName: 'Trần Thị Bình',
    email: 'binh.tran@email.com',
    phone: '0912 345 678',
    idNumber: '079 190 004 567',
    address: '18 Lê Văn Lương, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh',
    ...MOCK_COMPANIES.sunshine,
  },
  {
    customerCode: 'BS-000031',
    fullName: 'Trần Thị Bình',
    email: 'binh.tran@email.com',
    phone: '0912 345 678',
    idNumber: '079 190 004 567',
    address: '18 Lê Văn Lương, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh',
    ...MOCK_COMPANIES.bluesky,
  },
];

/**
 * Khách tự đăng ký qua website Nhà ở xã hội (cùng bảng tài khoản `cloud_portal_accounts`): chỉ có phiên NOXH,
 * chưa có hợp đồng. Đăng nhập được bằng SĐT hoặc CCCD.
 */
export const mockNoxhOnlyUsers: (User & { companyId: string })[] = [
  {
    id: 'user-noxh-001',
    customerCode: 'KH-000377',
    fullName: 'Lê Thu Hà',
    email: 'thuha.le@email.com',
    phone: '0938 111 222',
    idNumber: '001 099 012 345',
    address: '18 ngõ 102 Trường Chinh, Phường Phương Mai, Hà Nội',
    ...MOCK_COMPANIES.sunshine,
  },
];
