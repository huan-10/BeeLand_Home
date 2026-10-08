// Mật khẩu mới khi đăng ký / đặt lại (lib/validation.ts) phải khớp luật server fn_portal_app_otp_xac_minh: 6–72 ký tự. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./noxh-fixtures.cjs');

const v = load('lib/validation.ts');
const reg = (password, confirmPassword = password) =>
  v.validateRegisterForm({ phone: '0911000101', password, confirmPassword, acceptTerms: true });

test('đăng ký: mật khẩu 5 ký tự bị chặn trước khi gửi OTP, 6 ký tự được', () => {
  assert.equal(reg('12345').password, 'Mật khẩu phải từ 6 đến 72 ký tự');
  assert.equal(reg('123456').password, undefined);
  assert.equal(reg('x'.repeat(73)).password, 'Mật khẩu phải từ 6 đến 72 ký tự');
});

test('đặt lại mật khẩu: OTP, mật khẩu mới, nhập lại', () => {
  assert.deepEqual(v.validateResetForm({ otp: '', password: '', confirmPassword: '' }, 6), {
    otp: 'Vui lòng nhập mã OTP',
    password: 'Vui lòng nhập mật khẩu mới',
    confirmPassword: 'Vui lòng nhập lại mật khẩu mới',
  });
  const e = v.validateResetForm({ otp: '12345', password: '12345', confirmPassword: 'khac' }, 6);
  assert.equal(e.otp, 'Mã OTP gồm 6 chữ số');
  assert.equal(e.password, 'Mật khẩu phải từ 6 đến 72 ký tự');
  assert.equal(e.confirmPassword, 'Mật khẩu nhập lại không khớp');
  assert.equal(v.hasErrors(v.validateResetForm({ otp: '123456', password: '123456', confirmPassword: '123456' }, 6)), false);
});
