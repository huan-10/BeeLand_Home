import { normalizePhone } from '@/lib/validation';

import { ServiceError } from '../errors';
import { inList, restGet, rpc, str } from './client';
import { getServiceJwt } from './serviceAuth';

/**
 * Truy cập dữ liệu cổng khách hàng trên database dùng chung (web `beeland` + `beeland-app_2026`).
 * - Hàm có sẵn trên server, giống web `src/services/PortalAccountService.ts`:
 *   `fn_portal_account_get`, `fn_portal_account_set_password` (cần JWT nhân viên), `fn_portal_login`,
 *   `fn_portal_my_contracts`, `fn_portal_logout` (anon gọi được, theo token phiên khách).
 * - Bảng `cloud_customers` / `cloud_companies` đọc bằng JWT tài khoản hệ thống (RLS: `beesky1` thấy mọi công ty).
 */

export interface CustomerRow {
  id: string;
  ma_ctdk: string;
  ten_kh: string | null;
  ten_cong_ty: string | null;
  dien_thoai: string | null;
  di_dong: string | null;
  email: string | null;
  dia_chi: string | null;
  cccd: string | null;
  so_cmnd: string | null;
  ma_so_kh: string | null;
}

export interface PortalAccountRow {
  id: string;
  username: string | null;
  email: string | null;
  is_active: boolean;
  /** Có giá trị = khách tự đăng ký qua website (NOXH `mau4`) → đăng nhập bằng `fn_portal_site_login` (R21). */
  nguon_web_config_id?: string | null;
  pham_vi?: 'TAT_CA' | 'CHON' | null;
}

/** Phiên do `fn_portal_login` cấp (giống `PortalSession` của web). */
export interface PortalLoginRow {
  session_token: string;
  account_id: string;
  khach_hang_id: string;
  ma_ctdk: string;
  username: string | null;
  email: string | null;
  ten_kh: string | null;
  di_dong: string | null;
  ma_so_kh: string | null;
}

const CUSTOMER_COLUMNS = 'id,ma_ctdk,ten_kh,ten_cong_ty,dien_thoai,di_dong,email,dia_chi,cccd,so_cmnd,ma_so_kh';

/** Gọi bằng JWT hệ thống; JWT bị từ chối (hết hạn/thu hồi) thì đăng nhập lại một lần. */
export async function withServiceJwt<T>(run: (jwt: string) => Promise<T>): Promise<T> {
  try {
    return await run(await getServiceJwt());
  } catch (e) {
    if (e instanceof ServiceError && e.code === 'UNAUTHORIZED') return run(await getServiceJwt(true));
    throw e;
  }
}

/**
 * Mẫu LIKE khớp mọi cách ghi SĐT (khoảng trắng, dấu chấm, +84…): `*3*3*9*4*2*7*4*6*7` (bỏ số 0 đầu),
 * sau đó lọc lại chính xác bằng `normalizePhone` ở client.
 */
function phoneLikePattern(phone: string): string {
  return `*${normalizePhone(phone).replace(/^0/, '').split('').join('*')}`;
}

/** Hồ sơ khách hàng có `dien_thoai` trùng SĐT, ở mọi công ty mà tài khoản hệ thống thấy được. */
export function findCustomersByPhone(phone: string): Promise<CustomerRow[]> {
  const target = normalizePhone(phone);
  const pattern = encodeURIComponent(phoneLikePattern(phone));
  return withServiceJwt(async (jwt) => {
    const rows = await restGet<CustomerRow[]>(`cloud_customers?select=${CUSTOMER_COLUMNS}&dien_thoai=like.${pattern}&limit=100`, jwt);
    return (rows ?? []).filter((r) => normalizePhone(str(r.dien_thoai)) === target);
  });
}

export function getCustomer(id: string): Promise<CustomerRow | null> {
  return withServiceJwt(async (jwt) => {
    const rows = await restGet<CustomerRow[]>(`cloud_customers?select=${CUSTOMER_COLUMNS}&id=eq.${encodeURIComponent(id)}&limit=1`, jwt);
    return rows?.[0] ?? null;
  });
}

/** Hồ sơ khách hàng có CCCD trùng (đăng nhập bằng CCCD — tài khoản đăng ký trên website NOXH). */
export function findCustomersByCccd(cccd: string): Promise<CustomerRow[]> {
  const target = cccd.replace(/\D/g, '');
  const pattern = encodeURIComponent(`*${target.split('').join('*')}*`);
  return withServiceJwt(async (jwt) => {
    const rows = await restGet<CustomerRow[]>(`cloud_customers?select=${CUSTOMER_COLUMNS}&or=(cccd.like.${pattern},so_cmnd.like.${pattern})&limit=100`, jwt);
    return (rows ?? []).filter((r) => [r.cccd, r.so_cmnd].some((v) => str(v).replace(/\D/g, '') === target));
  });
}

export interface NoxhSites {
  /** Slug website NOXH theo công ty (công ty có nhiều website mau4 → website đầu tiên). */
  byCompany: Record<string, string>;
  /** Slug theo id website — tài khoản tự đăng ký đăng nhập trên đúng website của mình. */
  byConfig: Record<string, string>;
}

/** Website Nhà ở xã hội (`template_code = 'mau4'`, đang chạy) của các công ty — chỉ đọc. */
export async function getNoxhSites(companyIds: string[]): Promise<NoxhSites> {
  const empty: NoxhSites = { byCompany: {}, byConfig: {} };
  if (companyIds.length === 0) return empty;
  try {
    return await withServiceJwt(async (jwt) => {
      const rows = await restGet<{ id: string; company_id: string; slug: string | null; is_active: boolean | null }[]>(
        `cloud_customer_web_configs?select=id,company_id,slug,is_active&template_code=eq.mau4&company_id=in.${encodeURIComponent(inList(companyIds))}&order=id`,
        jwt,
      );
      const out: NoxhSites = { byCompany: {}, byConfig: {} };
      for (const r of rows ?? []) {
        if (!r.slug || r.is_active === false) continue;
        out.byConfig[r.id] = r.slug;
        out.byCompany[r.company_id] ??= r.slug;
      }
      return out;
    });
  } catch {
    // Không đọc được → coi như chưa có website NOXH (đăng nhập hợp đồng vẫn chạy).
    return empty;
  }
}

/** Tài khoản cổng khách hàng của một hồ sơ (null nếu chưa có). */
export function getPortalAccount(companyId: string, customerId: string): Promise<PortalAccountRow | null> {
  return withServiceJwt(async (jwt) => {
    const data = await rpc<PortalAccountRow | null>('fn_portal_account_get', { p_ma_ctdk: companyId, p_khach_hang_id: customerId }, jwt);
    return data && typeof data === 'object' && 'id' in data ? data : null;
  });
}

/** Tạo (hoặc đặt lại) tài khoản cổng khách hàng — hàm server có sẵn, mật khẩu băm bcrypt trên server. */
export function setPortalPassword(params: { companyId: string; customerId: string; password: string; username: string }) {
  return withServiceJwt((jwt) =>
    rpc<Record<string, unknown>>(
      'fn_portal_account_set_password',
      { p_ma_ctdk: params.companyId, p_khach_hang_id: params.customerId, p_password: params.password, p_username: params.username, p_email: null },
      jwt,
    ),
  );
}

/** Tên công ty theo id; lỗi đọc → trả rỗng (giao diện tự dùng tên dự phòng). */
export async function getCompanyNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  try {
    return await withServiceJwt(async (jwt) => {
      const rows = await restGet<{ id: string; ten_ct: string | null; code: string | null }[]>(
        `cloud_companies?select=id,ten_ct,code&id=in.${encodeURIComponent(inList(ids))}`,
        jwt,
      );
      return Object.fromEntries((rows ?? []).map((r) => [r.id, str(r.ten_ct) || str(r.code).toUpperCase()]));
    });
  } catch {
    return {};
  }
}

/** Khách đăng nhập (anon) — giống `portalLogin` của web. */
export function portalLogin(companyId: string, login: string, password: string): Promise<PortalLoginRow> {
  return rpc<PortalLoginRow>('fn_portal_login', { p_company_id: companyId, p_login: login, p_password: password });
}

const isLoginRow = (v: unknown): v is PortalLoginRow =>
  typeof v === 'object' && v !== null && typeof (v as { session_token?: unknown }).session_token === 'string';

/**
 * Đăng nhập theo website (`fn_portal_site_login`, mọi mẫu): nhận SĐT / email / username / CCCD 12 số.
 * Trên slug `mau4` → phiên chỉ gọi được `fn_portal_noxh_*`. Lỗi nghiệp vụ trả `{ error }` (R5), không ném.
 */
export async function siteLogin(slug: string, login: string, password: string): Promise<PortalLoginRow> {
  const res = await rpc<unknown>('fn_portal_site_login', { p_slug: slug, p_login: login, p_password: password });
  if (isLoginRow(res)) return res;
  const message = typeof res === 'object' && res !== null && 'error' in res ? str(res.error) : '';
  throw new ServiceError(message || 'Đăng nhập không thành công', 'UNAUTHORIZED', 'password');
}

/** Kiểm tra phiên NOXH còn hạn (`fn_portal_noxh_me`, chỉ đọc). */
export async function noxhSessionAlive(token: string): Promise<boolean> {
  const res = await rpc<{ data?: unknown; error?: string }>('fn_portal_noxh_me', { p_token: token });
  return !res?.error && !!res?.data;
}

/** Hợp đồng của khách theo token phiên (anon) — cũng dùng để kiểm tra phiên còn hạn. */
export function listMyContracts(token: string): Promise<{ rows?: unknown[] }> {
  return rpc<{ rows?: unknown[] }>('fn_portal_my_contracts', { p_token: token });
}

export function portalLogout(token: string): Promise<unknown> {
  return rpc('fn_portal_logout', { p_token: token });
}
