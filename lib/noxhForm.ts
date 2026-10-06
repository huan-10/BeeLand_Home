/**
 * Form Thông tin cá nhân NOXH — kiểm lỗi từng ô và chuyển đổi ngày dd/MM/yyyy (thuần, có test `tests/noxh-form.test.cjs`).
 * Chỉ `import type`.
 */
import type { NoxhAddress, NoxhCustomerSnapshot, NoxhSavePayload } from '@/types/noxh';

/** Khoá lỗi = tên ô trên form. */
export type PersonalInfoField =
  | 'ten_kh'
  | 'ngay_sinh'
  | 'gioi_tinh'
  | 'email'
  | 'tt_tinh'
  | 'tt_xa'
  | 'tt_dia_chi'
  | 'ht_tinh'
  | 'ht_xa'
  | 'ht_dia_chi'
  | 'loai_can';

export type PersonalInfoErrors = Partial<Record<PersonalInfoField, string>>;

const blank = (v: string | null | undefined) => !v || !v.trim();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADULT_AGE = 18;

/** Ngày yyyy-MM-dd đủ 18 tuổi tính tới `today`. */
function isAdult(iso: string, today: Date): boolean {
  const [y, m, d] = iso.split('-').map(Number);
  const limit = new Date(Date.UTC(today.getUTCFullYear() - ADULT_AGE, today.getUTCMonth(), today.getUTCDate()));
  return Date.UTC(y, m - 1, d) <= limit.getTime();
}

function addressErrors(a: NoxhAddress, prefix: 'tt' | 'ht', label: string): PersonalInfoErrors {
  const out: PersonalInfoErrors = {};
  if (blank(a.ma_tinh)) out[`${prefix}_tinh`] = 'Vui lòng chọn tỉnh/thành phố';
  if (blank(a.ma_xa)) out[`${prefix}_xa`] = 'Vui lòng chọn phường/xã';
  if (blank(a.dia_chi)) out[`${prefix}_dia_chi`] = `Vui lòng nhập ${label}`;
  return out;
}

/** Lỗi từng ô của form Thông tin cá nhân (rỗng = hợp lệ). */
export function validatePersonalInfo(s: NoxhCustomerSnapshot, loaiCanId: string | null | undefined, today: Date = new Date()): PersonalInfoErrors {
  const out: PersonalInfoErrors = {};
  if (blank(s.ten_kh)) out.ten_kh = 'Vui lòng nhập họ tên';
  if (blank(s.ngay_sinh)) out.ngay_sinh = 'Vui lòng nhập ngày sinh';
  else if (s.ngay_sinh && !isAdult(s.ngay_sinh, today)) out.ngay_sinh = 'Người đăng ký phải đủ 18 tuổi';
  if (blank(s.gioi_tinh)) out.gioi_tinh = 'Vui lòng chọn giới tính';
  if (!blank(s.email) && !EMAIL.test(s.email.trim())) out.email = 'Email không hợp lệ';
  Object.assign(out, addressErrors(s.thuong_tru, 'tt', 'địa chỉ thường trú'));
  if (!s.hien_tai_giong_thuong_tru) Object.assign(out, addressErrors(s.hien_tai, 'ht', 'địa chỉ hiện tại'));
  if (blank(loaiCanId)) out.loai_can = 'Vui lòng chọn loại căn hộ';
  return out;
}

/** yyyy-MM-dd → dd/MM/yyyy (trống → ''). */
export function toDisplayDate(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** dd/MM/yyyy → yyyy-MM-dd; sai dạng hoặc ngày không tồn tại → null. */
export function parseDisplayDate(text: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Tự chèn dấu "/" khi gõ ngày: `12051990` → `12/05/1990`. */
export function maskDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
}

export function copyAddress(a: NoxhAddress): NoxhAddress {
  return { ...a };
}

/** SĐT dùng được để gửi lên: có giá trị và không phải bản che ("0859***385"). */
const usablePhone = (p: string | null | undefined): string | undefined => (p && p.trim() && !p.includes('*') ? p.trim() : undefined);

/**
 * Bản chụp kèm SĐT dự phòng (SĐT khách đang đăng nhập) khi hồ sơ chưa có — để kiểm "còn thiếu" đúng với dữ liệu sẽ gửi.
 * Máy chủ vẫn ưu tiên SĐT của tài khoản cổng nếu có.
 */
export function withAccountPhone(s: NoxhCustomerSnapshot, accountPhone: string | null | undefined): NoxhCustomerSnapshot {
  return usablePhone(s.di_dong) ? s : { ...s, di_dong: usablePhone(accountPhone) ?? '' };
}

/**
 * `khach_hang` gửi lên `fn_portal_noxh_ho_so_save` (lưu bước 2 và nộp): máy chủ dựng lại kh_snapshot từ đây nên phải đủ trường
 * (giống `toKhachHangPayload` của portal web). CCCD / mã KH / ảnh do máy chủ giữ → không gửi; ngày trống không gửi.
 */
export function khachHangPayload(s: NoxhCustomerSnapshot, accountPhone?: string | null): NoxhSavePayload['khach_hang'] {
  const kh: NoxhSavePayload['khach_hang'] = {
    ten_kh: s.ten_kh.trim(),
    di_dong: usablePhone(s.di_dong) ?? usablePhone(accountPhone),
    noi_cap: s.noi_cap.trim(),
    email: s.email.trim(),
    thuong_tru: { ...s.thuong_tru, dia_chi: s.thuong_tru.dia_chi.trim() },
    hien_tai_giong_thuong_tru: s.hien_tai_giong_thuong_tru,
    hien_tai: s.hien_tai_giong_thuong_tru ? { dia_chi: '', ma_xa: '', ten_xa: '', ma_tinh: '', ten_tinh: '' } : s.hien_tai,
  };
  if (s.ngay_sinh) kh.ngay_sinh = s.ngay_sinh;
  if (s.ngay_cap) kh.ngay_cap = s.ngay_cap;
  if (s.gioi_tinh) kh.gioi_tinh = s.gioi_tinh;
  return kh;
}
