import { DEMO_CREDENTIALS, mockUsers } from '@/data/mock/user';
import { isEmail, normalizePhone } from '@/lib/validation';
import type { AuthSession, User } from '@/types';

import { ServiceError } from './errors';
import { clone, simulateLatency } from './mockLatency';

export interface LoginResult {
  session: AuthSession;
  user: User;
}

export interface RegisterInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

const MOCK_TOKEN_PREFIX = 'mock-token-';

/**
 * Tài khoản mock: người dùng demo + tài khoản đăng ký trong phiên (chỉ lưu trong bộ nhớ).
 * TODO: xóa khi chuyển sang backend thật.
 */
const mockPasswords = new Map<string, string>([[mockUsers[0]?.id ?? '', DEMO_CREDENTIALS.password]]);
const registeredUsers: User[] = [];

function allUsers(): User[] {
  return [...mockUsers, ...registeredUsers];
}

function findUser(identifier: string): User | undefined {
  const value = identifier.trim();
  if (isEmail(value)) return allUsers().find((u) => u.email.toLowerCase() === value.toLowerCase());
  const phone = normalizePhone(value);
  return allUsers().find((u) => normalizePhone(u.phone) === phone);
}

/**
 * Gợi ý tài khoản dùng thử hiển thị ở màn hình đăng nhập.
 * TODO: đặt thành `null` khi chuyển sang đăng nhập thật.
 */
export const demoAccountHint: { email: string; phone: string; password: string } | null = {
  email: DEMO_CREDENTIALS.email,
  phone: mockUsers[0]?.phone ?? '',
  password: DEMO_CREDENTIALS.password,
};

/** Đăng nhập bằng số điện thoại hoặc email. Lỗi gắn với ô nhập qua `ServiceError.field`. */
export async function login(identifier: string, password: string): Promise<LoginResult> {
  // TODO: thay bằng gọi API/database thật (ví dụ POST /auth/login)
  await simulateLatency();
  const user = findUser(identifier);
  if (!user) {
    throw new ServiceError(
      'Không tìm thấy tài khoản với số điện thoại hoặc email này.',
      'UNAUTHORIZED',
      'identifier',
    );
  }
  if (mockPasswords.get(user.id) !== password) {
    throw new ServiceError('Mật khẩu không đúng. Vui lòng thử lại hoặc chọn "Quên mật khẩu?".', 'UNAUTHORIZED', 'password');
  }
  return {
    session: { token: `${MOCK_TOKEN_PREFIX}${user.id}`, userId: user.id, createdAt: new Date().toISOString() },
    user: clone(user),
  };
}

export async function register(input: RegisterInput): Promise<void> {
  // TODO: thay bằng gọi API/database thật (ví dụ POST /auth/register)
  await simulateLatency();
  if (findUser(input.email)) throw new ServiceError('Email này đã được đăng ký.', 'CONFLICT', 'email');
  if (findUser(input.phone)) throw new ServiceError('Số điện thoại này đã được đăng ký.', 'CONFLICT', 'phone');
  const id = `user-reg-${registeredUsers.length + 1}`;
  registeredUsers.push({
    id,
    customerCode: `KH-NEW${String(registeredUsers.length + 1).padStart(3, '0')}`,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    idNumber: '',
    address: '',
  });
  mockPasswords.set(id, input.password);
}

/** Gửi hướng dẫn đặt lại mật khẩu. Không tiết lộ tài khoản có tồn tại hay không. */
export async function requestPasswordReset(identifier: string): Promise<{ channel: 'email' | 'sms' }> {
  // TODO: thay bằng gọi API/database thật (ví dụ POST /auth/forgot-password)
  await simulateLatency();
  return { channel: isEmail(identifier) ? 'email' : 'sms' };
}

export interface ChangePasswordResult {
  status: 'changed' | 'unavailable';
  message: string;
}

/**
 * Đổi mật khẩu (hiện chỉ có giao diện): kiểm tra mật khẩu hiện tại trên dữ liệu mock, không lưu mật khẩu mới.
 * TODO: thay bằng gọi API/database thật (ví dụ POST /auth/change-password) và trả `status: 'changed'`.
 */
export async function changePassword(userId: string, currentPassword: string, _newPassword: string): Promise<ChangePasswordResult> {
  await simulateLatency();
  if (mockPasswords.get(userId) !== currentPassword) {
    throw new ServiceError('Mật khẩu hiện tại không đúng.', 'UNAUTHORIZED', 'currentPassword');
  }
  return { status: 'unavailable', message: 'Đổi mật khẩu sẽ hoạt động khi ứng dụng kết nối hệ thống. Mật khẩu của bạn chưa thay đổi.' };
}

export async function logout(_session: AuthSession | null): Promise<void> {
  // TODO: thay bằng gọi API/database thật (ví dụ POST /auth/logout để hủy token)
  await simulateLatency(150, 300);
}

/** Lấy người dùng hiện tại từ phiên đã lưu. Trả về null nếu phiên không còn hợp lệ. */
export async function getCurrentUser(session: AuthSession): Promise<User | null> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /me với Authorization: Bearer <token>)
  await simulateLatency();
  if (!session.token.startsWith(MOCK_TOKEN_PREFIX)) return null;
  const user = allUsers().find((u) => u.id === session.userId);
  return user ? clone(user) : null;
}
