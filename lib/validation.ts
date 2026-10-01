const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Số di động Việt Nam: 10 số bắt đầu bằng 0, hoặc +84 / 84 + 9 số. */
const PHONE_PATTERN = /^(0|\+?84)(3|5|7|8|9)\d{8}$/;

export const MIN_PASSWORD_LENGTH = 6;

/** Bỏ khoảng trắng, dấu chấm, gạch ngang và chuẩn hóa +84 → 0. */
export function normalizePhone(value: string): string {
  const digits = value.replace(/[\s.-]/g, '');
  if (digits.startsWith('+84')) return `0${digits.slice(3)}`;
  if (digits.startsWith('84') && digits.length === 11) return `0${digits.slice(2)}`;
  return digits;
}

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.replace(/[\s.-]/g, ''));
}

/** Lỗi theo từng ô; khóa trùng tên ô trong form. */
export type FormErrors<K extends string> = Partial<Record<K, string>>;

export function hasErrors<K extends string>(errors: FormErrors<K>): boolean {
  return Object.values(errors).some(Boolean);
}

function validateIdentifier(identifier: string): string | undefined {
  const value = identifier.trim();
  if (!value) return 'Vui lòng nhập số điện thoại hoặc email';
  if (value.includes('@')) return isEmail(value) ? undefined : 'Email không đúng định dạng (ví dụ: ten@email.com)';
  if (/^[\d\s.+-]+$/.test(value)) return isPhone(value) ? undefined : 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0';
  return 'Vui lòng nhập số điện thoại hoặc email hợp lệ';
}

export type LoginField = 'identifier' | 'password';

export function validateLoginForm(identifier: string, password: string): FormErrors<LoginField> {
  const errors: FormErrors<LoginField> = {};
  errors.identifier = validateIdentifier(identifier);
  if (!password) errors.password = 'Vui lòng nhập mật khẩu';
  return errors;
}

export type RegisterField = 'fullName' | 'phone' | 'email' | 'password' | 'confirmPassword' | 'acceptTerms';

export interface RegisterFormValues {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export function validateRegisterForm(values: RegisterFormValues): FormErrors<RegisterField> {
  const errors: FormErrors<RegisterField> = {};
  if (values.fullName.trim().length < 2) errors.fullName = 'Vui lòng nhập họ và tên';
  if (!values.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
  else if (!isPhone(values.phone)) errors.phone = 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0';
  if (!values.email.trim()) errors.email = 'Vui lòng nhập email';
  else if (!isEmail(values.email)) errors.email = 'Email không đúng định dạng (ví dụ: ten@email.com)';
  if (!values.password) errors.password = 'Vui lòng nhập mật khẩu';
  else if (values.password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`;
  if (!values.confirmPassword) errors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
  if (!values.acceptTerms) errors.acceptTerms = 'Bạn cần đồng ý với điều khoản sử dụng';
  return errors;
}

export function validateForgotForm(identifier: string): FormErrors<'identifier'> {
  return { identifier: validateIdentifier(identifier) };
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
