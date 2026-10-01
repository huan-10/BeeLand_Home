const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

export function validateLoginForm(email: string, password: string): LoginFormErrors {
  const errors: LoginFormErrors = {};
  if (!email.trim()) errors.email = 'Vui lòng nhập email';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Email không hợp lệ';
  if (!password) errors.password = 'Vui lòng nhập mật khẩu';
  else if (password.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
  return errors;
}

export function hasErrors(errors: LoginFormErrors): boolean {
  return Boolean(errors.email || errors.password);
}
