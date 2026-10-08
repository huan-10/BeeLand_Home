/** Số di động Việt Nam: 10 số bắt đầu bằng 0, hoặc +84 / 84 + 9 số. */
const PHONE_PATTERN = /^(0|\+?84)(3|5|7|8|9)\d{8}$/;

export const MIN_PASSWORD_LENGTH = 6;
/** Mật khẩu MỚI (đăng ký / đặt lại qua OTP) — khớp luật server `fn_portal_app_otp_xac_minh` (giống web NOXH). Đăng nhập vẫn nhận mật khẩu cũ 6 ký tự. */
export const NEW_PASSWORD_MIN_LENGTH = 6;
export const NEW_PASSWORD_MAX_LENGTH = 72;
const NEW_PASSWORD_RANGE = `Mật khẩu phải từ ${NEW_PASSWORD_MIN_LENGTH} đến ${NEW_PASSWORD_MAX_LENGTH} ký tự`;
const badNewPassword = (p: string) => p.trim().length < NEW_PASSWORD_MIN_LENGTH || p.trim().length > NEW_PASSWORD_MAX_LENGTH;

/** Bỏ khoảng trắng, dấu chấm, gạch ngang và chuẩn hóa +84 → 0. */
export function normalizePhone(value: string): string {
  const digits = value.replace(/[\s.-]/g, '');
  if (digits.startsWith('+84')) return `0${digits.slice(3)}`;
  if (digits.startsWith('84') && digits.length === 11) return `0${digits.slice(2)}`;
  return digits;
}

export function isPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.replace(/[\s.-]/g, ''));
}

/** Lỗi theo từng ô; khóa trùng tên ô trong form. */
export type FormErrors<K extends string> = Partial<Record<K, string>>;

export function hasErrors<K extends string>(errors: FormErrors<K>): boolean {
  return Object.values(errors).some(Boolean);
}

/** Tài khoản khách hàng định danh bằng số điện thoại (không dùng email). */
function validatePhone(phone: string): string | undefined {
  const value = phone.trim();
  if (!value) return 'Vui lòng nhập số điện thoại';
  return isPhone(value) ? undefined : 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0';
}

export type LoginField = 'identifier' | 'password';

/** Ô đăng nhập nhận SĐT hoặc CCCD 12 số (tài khoản đăng ký trên website NOXH đăng nhập bằng CCCD được). */
export function parseLoginId(value: string): { kind: 'phone'; value: string } | { kind: 'cccd'; value: string } | null {
  const digits = value.replace(/[\s.-]/g, '');
  if (/^\d{12}$/.test(digits)) return { kind: 'cccd', value: digits };
  return isPhone(value) ? { kind: 'phone', value: normalizePhone(value) } : null;
}

export function validateLoginForm(identifier: string, password: string): FormErrors<LoginField> {
  const errors: FormErrors<LoginField> = {};
  if (!identifier.trim()) errors.identifier = 'Vui lòng nhập số điện thoại hoặc CCCD';
  else if (!parseLoginId(identifier)) errors.identifier = 'Nhập số điện thoại 10 số hoặc CCCD 12 số';
  if (!password) errors.password = 'Vui lòng nhập mật khẩu';
  return errors;
}

export type RegisterField = 'phone' | 'password' | 'confirmPassword' | 'acceptTerms';

/** Họ tên, email… lấy từ hồ sơ khách hàng trong hệ thống theo số điện thoại, nên form không hỏi. */
export interface RegisterFormValues {
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export function validateRegisterForm(values: RegisterFormValues): FormErrors<RegisterField> {
  const errors: FormErrors<RegisterField> = {};
  errors.phone = validatePhone(values.phone);
  if (!values.password) errors.password = 'Vui lòng nhập mật khẩu';
  else if (badNewPassword(values.password)) errors.password = NEW_PASSWORD_RANGE;
  if (!values.confirmPassword) errors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
  if (!values.acceptTerms) errors.acceptTerms = 'Bạn cần đồng ý với điều khoản sử dụng';
  return errors;
}

export function validateForgotForm(identifier: string): FormErrors<'identifier'> {
  return { identifier: validatePhone(identifier) };
}

export type ResetField = 'otp' | 'password' | 'confirmPassword';

/** Quên mật khẩu bước 2: mã OTP + mật khẩu mới + nhập lại. */
export function validateResetForm(values: Record<ResetField, string>, otpLength: number): FormErrors<ResetField> {
  const errors: FormErrors<ResetField> = { otp: validateOtp(values.otp, otpLength) };
  if (!values.password) errors.password = 'Vui lòng nhập mật khẩu mới';
  else if (badNewPassword(values.password)) errors.password = NEW_PASSWORD_RANGE;
  if (!values.confirmPassword) errors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới';
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
  return errors;
}

export type ChangePasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

export interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function validateChangePasswordForm(values: ChangePasswordValues): FormErrors<ChangePasswordField> {
  const errors: FormErrors<ChangePasswordField> = {};
  if (!values.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
  if (!values.newPassword) errors.newPassword = 'Vui lòng nhập mật khẩu mới';
  else if (values.newPassword.length < MIN_PASSWORD_LENGTH)
    errors.newPassword = `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`;
  else if (values.newPassword === values.currentPassword) errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
  if (!values.confirmPassword) errors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới';
  else if (values.confirmPassword !== values.newPassword) errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
  return errors;
}

/** Mã OTP gồm đúng `length` chữ số. */
export function validateOtp(otp: string, length: number): string | undefined {
  const value = otp.trim();
  if (!value) return 'Vui lòng nhập mã OTP';
  return new RegExp(`^\\d{${length}}$`).test(value) ? undefined : `Mã OTP gồm ${length} chữ số`;
}

/** Đã kiểm tra có tài khoản nhưng đăng nhập bị từ chối (máy chủ trả chung "tên đăng nhập hoặc mật khẩu") → là sai mật khẩu. */
export const WRONG_PASSWORD = 'Mật khẩu không đúng. Vui lòng thử lại hoặc chọn "Quên mật khẩu?".';
/** SĐT / CCCD không có tài khoản cổng khách hàng ở công ty nào. */
export const ACCOUNT_NOT_FOUND = 'Số điện thoại / CCCD chưa có tài khoản. Vui lòng chọn "Đăng ký" để tạo tài khoản.';

/**
 * Câu báo khi mọi lần đăng nhập (các công ty của khách) đều bị từ chối. App đã biết tài khoản TỒN TẠI trước bước này,
 * nên lỗi chung của máy chủ ("Tên đăng nhập hoặc mật khẩu không đúng") nghĩa là sai mật khẩu. Riêng khoá tạm (sai 5 lần)
 * và tài khoản không dùng được trên website thì giữ câu của máy chủ.
 */
export function loginRejectMessage(serverMessages: string[]): string {
  const specific = serverMessages.find((m) => /tạm khoá|tạm khóa|không được dùng/i.test(m));
  return specific ?? WRONG_PASSWORD;
}
