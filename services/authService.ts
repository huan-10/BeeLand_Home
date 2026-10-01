import { DEMO_CREDENTIALS, mockUsers } from '@/data/mock/user';
import type { AuthSession, User } from '@/types';

import { ServiceError } from './errors';
import { clone, simulateLatency } from './mockLatency';

export interface LoginResult {
  session: AuthSession;
  user: User;
}

const MOCK_TOKEN_PREFIX = 'mock-token-';

/**
 * Gợi ý tài khoản dùng thử hiển thị ở màn hình đăng nhập.
 * TODO: đặt thành `null` khi chuyển sang đăng nhập thật.
 */
export const demoAccountHint: { email: string; password: string } | null = { ...DEMO_CREDENTIALS };

export async function login(email: string, password: string): Promise<LoginResult> {
  // TODO: thay bằng gọi API/database thật (ví dụ POST /auth/login)
  await simulateLatency();
  const normalizedEmail = email.trim().toLowerCase();
  const user = mockUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || normalizedEmail !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
    throw new ServiceError('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.', 'UNAUTHORIZED');
  }
  return {
    session: { token: `${MOCK_TOKEN_PREFIX}${user.id}`, userId: user.id, createdAt: new Date().toISOString() },
    user: clone(user),
  };
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
  const user = mockUsers.find((u) => u.id === session.userId);
  return user ? clone(user) : null;
}
