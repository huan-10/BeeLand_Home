// "Ghi nhớ đăng nhập" (lib/rememberedLogin.ts): đọc / ghi SĐT + mật khẩu đã nhớ. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./noxh-fixtures.cjs');

const m = load('lib/rememberedLogin.ts');

test('ghi rồi đọc lại đúng SĐT + mật khẩu', () => {
  assert.deepEqual(m.parseRememberedLogin(m.serializeRememberedLogin({ identifier: '0923716866', password: 'Matkhau1' })), {
    identifier: '0923716866',
    password: 'Matkhau1',
  });
});

test('web: không ghi mật khẩu (chỉ nhớ SĐT)', () => {
  assert.deepEqual(m.parseRememberedLogin(m.serializeRememberedLogin({ identifier: '0923716866', password: 'Matkhau1' }, false)), {
    identifier: '0923716866',
    password: '',
  });
});

test('dữ liệu hỏng / trống / thiếu SĐT → không có gì để điền', () => {
  assert.equal(m.parseRememberedLogin(null), null);
  assert.equal(m.parseRememberedLogin('khong-phai-json'), null);
  assert.equal(m.parseRememberedLogin('{"password":"x"}'), null);
  assert.equal(m.parseRememberedLogin('{"identifier":"  "}'), null);
});
