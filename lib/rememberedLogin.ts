/**
 * "Ghi nhớ đăng nhập" (người dùng chốt 2026-10-08): tick ghi nhớ → sau khi đăng xuất, màn Đăng nhập điền sẵn SĐT/CCCD + mật khẩu.
 * Lưu trong Keychain / Keystore (expo-secure-store, `lib/sessionStorage.ts`); web chỉ nhớ SĐT (trình duyệt tự lo mật khẩu).
 */
export interface RememberedLogin {
  identifier: string;
  password: string;
}

export function serializeRememberedLogin(value: RememberedLogin, withPassword = true): string {
  return JSON.stringify({ identifier: value.identifier.trim(), password: withPassword ? value.password : '' });
}

export function parseRememberedLogin(raw: string | null | undefined): RememberedLogin | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null) return null;
    const { identifier, password } = v as { identifier?: unknown; password?: unknown };
    if (typeof identifier !== 'string' || !identifier.trim()) return null;
    return { identifier: identifier.trim(), password: typeof password === 'string' ? password : '' };
  } catch {
    return null;
  }
}
