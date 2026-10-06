/**
 * JWT tài khoản hệ thống lưu đệm (AsyncStorage) — gắn với tài khoản đã cấp nó.
 * JWT sống 7 ngày: đổi tài khoản trong `.env.local` (ví dụ `brg` → `beesky1`) mà vẫn dùng JWT cũ thì app chỉ tra được
 * khách của công ty cũ (lỗi 2026-10-05: không thấy hồ sơ MSR cùng SĐT). Tài khoản khác → bỏ JWT, đăng nhập lại.
 */

export interface ServiceJwtCache {
  jwt: string;
  expiresAt: number;
  /** `serviceAccountKey` của tài khoản đã cấp JWT. */
  account: string;
}

/** Làm mới sớm 5 phút trước khi hết hạn. */
const EARLY_MS = 5 * 60 * 1000;

export function serviceAccountKey(account: { company: string; email: string }): string {
  return `${account.company.trim().toLowerCase()}|${account.email.trim().toLowerCase()}`;
}

export function serializeServiceJwt(cache: ServiceJwtCache): string {
  return JSON.stringify(cache);
}

/** JWT còn dùng được cho `account`; sai dạng / sắp hết hạn / của tài khoản khác (kể cả bản cũ không ghi tài khoản) → null. */
export function usableServiceJwt(cache: unknown, account: string, now: number): string | null {
  if (typeof cache !== 'object' || cache === null) return null;
  const o = cache as Partial<Record<keyof ServiceJwtCache, unknown>>;
  if (typeof o.jwt !== 'string' || o.account !== account) return null;
  return (Number(o.expiresAt) || 0) - EARLY_MS > now ? o.jwt : null;
}

/** Như `usableServiceJwt`, đọc từ chuỗi đã lưu (AsyncStorage); dữ liệu hỏng → null. */
export function readServiceJwt(raw: string | null, account: string, now: number): string | null {
  if (!raw) return null;
  try {
    return usableServiceJwt(JSON.parse(raw), account, now);
  } catch {
    return null;
  }
}
