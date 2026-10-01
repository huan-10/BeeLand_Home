import type { User } from '@/types';

/** Tài khoản demo. Mật khẩu chỉ dùng cho đăng nhập giả lập. */
export const DEMO_CREDENTIALS = {
  email: 'demo@beesky.vn',
  password: '123456',
} as const;

export const mockUsers: User[] = [
  {
    id: 'user-001',
    customerCode: 'KH-000128',
    fullName: 'Nguyễn Văn An',
    email: DEMO_CREDENTIALS.email,
    phone: '0901 234 567',
    idNumber: '079 090 001 234',
    address: '125 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh',
  },
];
