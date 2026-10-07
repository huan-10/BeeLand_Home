// Ô đăng nhập nhận SĐT hoặc CCCD (lib/validation.ts). Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./noxh-fixtures.cjs');

const v = load('lib/validation.ts');

test('parseLoginId: CCCD 12 số (bỏ khoảng trắng), SĐT 10 số, sai dạng → null', () => {
  assert.deepEqual(v.parseLoginId('001 099 012 345'), { kind: 'cccd', value: '001099012345' });
  assert.deepEqual(v.parseLoginId('0938 111 222'), { kind: 'phone', value: '0938111222' });
  assert.deepEqual(v.parseLoginId('+84938111222'), { kind: 'phone', value: '0938111222' });
  assert.equal(v.parseLoginId('12345'), null);
});

test('validateLoginForm nhận CCCD; sai dạng báo lỗi chung', () => {
  assert.deepEqual(v.validateLoginForm('001099012345', 'x'), {});
  assert.equal(v.validateLoginForm('123', 'x').identifier, 'Nhập số điện thoại 10 số hoặc CCCD 12 số');
  assert.equal(v.validateLoginForm('', 'x').identifier, 'Vui lòng nhập số điện thoại hoặc CCCD');
});

test('lỗi đăng nhập khi đã có tài khoản: khoá tạm → báo khoá; còn lại → sai mật khẩu (không báo "sai tài khoản")', () => {
  assert.equal(v.loginRejectMessage(['Tên đăng nhập hoặc mật khẩu không đúng']), v.WRONG_PASSWORD);
  assert.equal(v.loginRejectMessage([]), v.WRONG_PASSWORD);
  assert.equal(v.loginRejectMessage(['Tên đăng nhập hoặc mật khẩu không đúng', 'Tài khoản tạm khoá, thử lại sau 15 phút']), 'Tài khoản tạm khoá, thử lại sau 15 phút');
  assert.equal(v.loginRejectMessage(['Tài khoản không được dùng trên website này, vui lòng liên hệ chủ đầu tư']), 'Tài khoản không được dùng trên website này, vui lòng liên hệ chủ đầu tư');
  assert.equal(v.ACCOUNT_NOT_FOUND, 'Số điện thoại / CCCD chưa có tài khoản. Vui lòng chọn "Đăng ký" để tạo tài khoản.');
});
