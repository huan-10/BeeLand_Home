import { parseOtpSend, parseOtpVerify, parseProfileList, type OtpChallenge, type OtpPurpose, type ProfileRow } from '@/lib/appOtp';
import { ACCOUNT_NOT_FOUND, loginRejectMessage, normalizePhone } from '@/lib/validation';
import type { CompanyOption } from '@/types';

import { ServiceError } from '../errors';
import { rpc, str } from './client';

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


export interface NoxhSites {
  /** Slug website NOXH theo công ty (công ty có nhiều website mau4 → website đầu tiên). */
  byCompany: Record<string, string>;
  /** Slug theo id website — tài khoản tự đăng ký đăng nhập trên đúng website của mình. */
  byConfig: Record<string, string>;
}

/** Website Nhà ở xã hội (mau4, đang chạy) của các công ty — `fn_portal_app_noxh_sites` (anon; slug là đường dẫn công khai). */
export async function getNoxhSites(companyIds: string[]): Promise<NoxhSites> {
  const empty: NoxhSites = { byCompany: {}, byConfig: {} };
  if (companyIds.length === 0) return empty;
  try {
    const res = await rpc<{ data?: Record<string, string> } | null>('fn_portal_app_noxh_sites', { p_company_ids: companyIds });
    return { byCompany: res?.data ?? {}, byConfig: {} };
  } catch {
    // Không đọc được → coi như chưa có website NOXH (đăng nhập hợp đồng vẫn chạy).
    return empty;
  }
}

const isLoginRow = (v: unknown): v is PortalLoginRow =>
  typeof v === 'object' && v !== null && typeof (v as { session_token?: unknown }).session_token === 'string';

/**
 * Khách đăng nhập phiên hợp đồng (anon) — `fn_portal_app_login` (beeland/supabase/migrations/20261009160000_portal_app_login.sql): cùng phạm vi tài khoản
 * với `fn_portal_login` cũ (đã bị thu quyền anon 2026-10-07, S-M10) và khoá 15 phút sau 5 lần sai. Lỗi nghiệp vụ trả `{ error }`.
 */
export async function portalLogin(companyId: string, login: string, password: string): Promise<PortalLoginRow> {
  const res = await rpc<unknown>('fn_portal_app_login', { p_company_id: companyId, p_login: login, p_password: password });
  if (isLoginRow(res)) return res;
  const message = typeof res === 'object' && res !== null && 'error' in res ? str(res.error) : '';
  throw new ServiceError(message || 'Đăng nhập không thành công', 'UNAUTHORIZED', 'password');
}

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

/**
 * OTP thật cho Đăng ký / Quên mật khẩu (anon, `beeland/supabase/migrations/20261009170000_portal_app_otp.sql`):
 * server tìm hồ sơ theo SĐT ở mọi công ty, gửi mã 6 số qua ZNS → SMS và tự kiểm mã trước khi tạo / đặt lại tài khoản.
 */
export async function sendAppOtp(phone: string, purpose: OtpPurpose): Promise<OtpChallenge> {
  const res = await rpc<unknown>('fn_portal_app_otp_gui', { p_sdt: phone, p_muc_dich: purpose });
  try {
    return parseOtpSend(res);
  } catch (e) {
    throw new ServiceError((e as Error).message, 'UNKNOWN', 'phone');
  }
}

/** Trả số tài khoản được tạo / đặt lại mật khẩu. */
export async function verifyAppOtp(otpId: string, code: string, password: string): Promise<number> {
  const res = await rpc<unknown>('fn_portal_app_otp_xac_minh', { p_otp_id: otpId, p_code: code, p_password: password });
  try {
    return parseOtpVerify(res);
  } catch (e) {
    const message = (e as Error).message;
    throw new ServiceError(message, 'UNKNOWN', message.startsWith('Mật khẩu') ? 'password' : 'otp');
  }
}

/**
 * Hồ sơ khách hàng của tài khoản ở công ty của phiên (`fn_portal_app_ho_so_list`, `20261009180000_portal_app_chon_ho_so.sql`):
 * cùng công ty, cùng SĐT — một công ty nhiều hồ sơ vẫn 1 tài khoản; phiên chọn hồ sơ đang xem.
 */
export async function listMyProfiles(token: string): Promise<{ rows: CustomerRow[]; activeId: string | null }> {
  try {
    const { rows, activeId } = parseProfileList(await rpc<unknown>('fn_portal_app_ho_so_list', { p_token: token }));
    return { rows: rows.map(profileToCustomer), activeId };
  } catch (e) {
    if (e instanceof ServiceError) throw e;
    throw new ServiceError((e as Error).message, 'UNKNOWN');
  }
}

/** Đặt hồ sơ đang xem cho phiên (server kiểm hồ sơ cùng công ty + cùng SĐT) — yêu cầu / thanh toán online theo hồ sơ này. */
export async function chooseProfile(token: string, customerId: string): Promise<void> {
  const res = await rpc<unknown>('fn_portal_app_chon_ho_so', { p_token: token, p_khach_hang_id: customerId });
  const error = typeof res === 'object' && res !== null && 'error' in res ? str((res as { error: unknown }).error) : '';
  if (error) throw new ServiceError(error, 'UNKNOWN');
}

/**
 * Khách tự xoá tài khoản (`fn_portal_app_xoa_tai_khoan`): xác nhận bằng mật khẩu, server xoá tài khoản của mọi token
 * + mọi tài khoản dùng cùng SĐT ở mọi công ty (phiên bị huỷ theo). Hồ sơ khách / hợp đồng của chủ đầu tư giữ nguyên.
 */
export async function deleteAppAccount(tokens: string[], password: string): Promise<void> {
  const res = await rpc<unknown>('fn_portal_app_xoa_tai_khoan', { p_tokens: tokens, p_password: password });
  const r = (typeof res === 'object' && res !== null ? res : {}) as { error?: unknown; ma?: unknown };
  const error = str(r.error);
  if (!error) return;
  if (r.ma === 'SAI_MAT_KHAU') throw new ServiceError(error, 'UNAUTHORIZED', 'password');
  throw new ServiceError(error, 'UNKNOWN');
}

const profileToCustomer = (r: ProfileRow): CustomerRow => ({
  id: r.id,
  ma_ctdk: r.ma_ctdk ?? '',
  ten_kh: r.ten_kh ?? null,
  ten_cong_ty: r.ten_cong_ty ?? null,
  dien_thoai: r.dien_thoai ?? null,
  di_dong: r.di_dong ?? null,
  email: r.email ?? null,
  dia_chi: r.dia_chi ?? null,
  cccd: r.cccd ?? null,
  so_cmnd: r.so_cmnd ?? null,
  ma_so_kh: r.ma_so_kh ?? null,
});

/** Một công ty trong kết quả đăng nhập trên server (`fn_portal_app_dang_nhap`). */
export interface AppSignInCompany {
  company_id: string;
  ten_ct: string | null;
  /** Phiên hợp đồng; null = tài khoản tự đăng ký qua website NOXH (chỉ có phiên NOXH). */
  token: string | null;
  account_id: string;
  khach_hang_id: string;
  username: string | null;
  noxh_slug: string | null;
  noxh_token: string | null;
  khach_hang: CustomerRow | null;
}

/**
 * Đăng nhập trên server (`beeland/supabase/migrations/20261009190000_portal_app_dang_nhap.sql`, anon): tra hồ sơ theo SĐT/CCCD,
 * đăng nhập mọi công ty, tự liên kết công ty mới sau khi mật khẩu đúng, lấy phiên NOXH — không dùng tài khoản hệ thống.
 */
export async function appSignIn(login: string, password: string): Promise<{ phone: string; companies: AppSignInCompany[] }> {
  const res = await rpc<unknown>('fn_portal_app_dang_nhap', { p_login: login, p_password: password });
  const r = (typeof res === 'object' && res !== null ? res : {}) as {
    data?: { sdt?: unknown; cong_ty?: unknown };
    error?: unknown;
    errors?: unknown;
    ma?: unknown;
  };
  if (r.data && Array.isArray(r.data.cong_ty)) return { phone: str(r.data.sdt), companies: r.data.cong_ty as AppSignInCompany[] };
  const message = str(r.error);
  if (r.ma === 'KHONG_CO_TAI_KHOAN') throw new ServiceError(message || ACCOUNT_NOT_FOUND, 'NOT_FOUND', 'identifier');
  if (r.ma === 'SAI_DANG') throw new ServiceError(message, 'UNKNOWN', 'identifier');
  const errors = Array.isArray(r.errors) ? r.errors.map(str) : [message];
  throw new ServiceError(loginRejectMessage(errors), 'UNAUTHORIZED', 'password');
}

/** Hồ sơ ở công ty mới theo SĐT tài khoản của phiên (`fn_portal_app_cong_ty_moi`, chỉ đọc) — bỏ các công ty đã có trong phiên. */
export async function findNewCompaniesByToken(token: string, knownCompanyIds: string[]): Promise<CompanyOption[]> {
  const res = await rpc<unknown>('fn_portal_app_cong_ty_moi', { p_token: token, p_da_co: knownCompanyIds });
  const r = (typeof res === 'object' && res !== null ? res : {}) as { data?: unknown; error?: unknown };
  if (!Array.isArray(r.data)) throw new ServiceError(str(r.error) || 'Không dò được hồ sơ ở công ty mới', 'UNKNOWN');
  return (r.data as Record<string, unknown>[]).map((x) => ({
    companyId: str(x.company_id),
    companyName: str(x.ten_ct),
    customerId: str(x.khach_hang_id),
    customerName: str(x.ten_kh),
    customerCode: str(x.ma_so_kh),
  }));
}
