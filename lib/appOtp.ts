/**
 * Kết quả RPC OTP thật của app (`beeland/supabase/migrations/20261009170000_portal_app_otp.sql`):
 * `fn_portal_app_otp_gui` → `{ data: { otp_id, het_han, do_dai_ma, gui_lai_sau } }`, `fn_portal_app_otp_xac_minh` → `{ data: { so_tai_khoan } }`.
 * Lỗi nghiệp vụ cả hai trả `{ error }` (câu tiếng Việt hiện thẳng cho khách).
 */

export type OtpPurpose = 'DANG_KY' | 'QUEN_MK';

export interface OtpChallenge {
  otpId: string;
  /** ISO — mã hết hạn (5 phút). */
  expiresAt: string;
  length: number;
  /** Số giây trước khi được gửi lại mã. */
  resendIn: number;
}

const SEND_FAILED = 'Không thể gửi mã xác thực, vui lòng thử lại';
const VERIFY_FAILED = 'Không thể hoàn tất, vui lòng thử lại';

function unwrap(res: unknown, fallback: string): Record<string, unknown> {
  if (typeof res === 'object' && res !== null) {
    const r = res as { error?: unknown; data?: unknown };
    if (typeof r.error === 'string' && r.error) throw new Error(r.error);
    if (typeof r.data === 'object' && r.data !== null) return r.data as Record<string, unknown>;
  }
  throw new Error(fallback);
}

export function parseOtpSend(res: unknown): OtpChallenge {
  const d = unwrap(res, SEND_FAILED);
  if (typeof d.otp_id !== 'string' || !d.otp_id) throw new Error(SEND_FAILED);
  return {
    otpId: d.otp_id,
    expiresAt: String(d.het_han ?? ''),
    length: Number(d.do_dai_ma) || 6,
    resendIn: Number(d.gui_lai_sau) || 60,
  };
}

/** Số tài khoản được tạo (đăng ký) hoặc đặt lại mật khẩu (quên mật khẩu). */
export function parseOtpVerify(res: unknown): number {
  return Number(unwrap(res, VERIFY_FAILED).so_tai_khoan) || 0;
}

/** Một hồ sơ khách hàng của tài khoản (`fn_portal_app_ho_so_list`) — cùng cột với `cloud_customers`. */
export interface ProfileRow {
  id: string;
  ma_ctdk?: string;
  ma_so_kh?: string | null;
  ten_kh?: string | null;
  ten_cong_ty?: string | null;
  dien_thoai?: string | null;
  di_dong?: string | null;
  email?: string | null;
  dia_chi?: string | null;
  cccd?: string | null;
  so_cmnd?: string | null;
  dang_xem?: boolean;
}

/** `fn_portal_app_ho_so_list` → các hồ sơ (cùng công ty, cùng SĐT) + hồ sơ phiên đang xem. */
export function parseProfileList(res: unknown): { rows: ProfileRow[]; activeId: string | null } {
  const data = unwrap(res, 'Không tải được danh sách hồ sơ');
  const rows = (Array.isArray(data) ? data : []).filter(
    (r): r is ProfileRow => typeof r === 'object' && r !== null && typeof (r as { id?: unknown }).id === 'string',
  );
  return { rows, activeId: rows.find((r) => r.dang_xem)?.id ?? null };
}
