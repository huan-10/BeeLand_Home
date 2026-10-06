import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';
import { ServiceError } from '../errors';

/**
 * Gọi Supabase (PostgREST + edge function) bằng fetch — tương đương `axiosApiSupabase` của app 2026:
 * header `apikey` = anon key, `Authorization: Bearer <JWT>` (JWT tài khoản hệ thống) hoặc anon key.
 * Lỗi `RAISE EXCEPTION` của hàm SQL nằm ở `message` → chuyển thành `ServiceError` (tiếng Việt từ server).
 */
async function request(path: string, init: RequestInit & { jwt?: string } = {}): Promise<unknown> {
  const { jwt, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${jwt || SUPABASE_ANON_KEY}`,
        ...headers,
      },
    });
  } catch {
    throw new ServiceError('Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.', 'NETWORK');
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data ? String((data as { message: unknown }).message) : '';
    if (__DEV__) console.log(`[supabase] ${res.status} ${path}`, text.slice(0, 300));
    if (res.status === 401 || res.status === 403) {
      throw new ServiceError(message || 'Không có quyền truy cập dữ liệu.', 'UNAUTHORIZED');
    }
    throw new ServiceError(message || 'Máy chủ đang bận. Vui lòng thử lại sau.', 'UNKNOWN');
  }
  return data;
}

/** Đọc bảng: `rest('cloud_customers?select=id&dien_thoai=eq.0901…', jwt)`. */
export function restGet<T>(query: string, jwt?: string): Promise<T> {
  return request(`rest/v1/${query}`, { method: 'GET', jwt }) as Promise<T>;
}

/** Gọi hàm SQL: `rpc('fn_portal_login', { … })`. */
export function rpc<T>(fn: string, args: Record<string, unknown>, jwt?: string): Promise<T> {
  return request(`rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args), jwt }) as Promise<T>;
}

/** Gọi edge function: `edge('cloud-auth', { action: 'login', … })`. */
export function edge<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  return request(`functions/v1/${fn}`, { method: 'POST', body: JSON.stringify(body) }) as Promise<T>;
}

/** Giá trị an toàn cho bộ lọc `in.(…)` của PostgREST. */
export const inList = (values: string[]) => `(${values.map((v) => `"${v.replace(/"/g, '')}"`).join(',')})`;

export function str(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}
