// Mở app ngân hàng điền sẵn (lib/bankApps.ts): dựng link VietQR deeplink, mã ngân hàng nhận, thứ tự app. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const b = loadModule('lib/bankApps.ts');

const info = (o = {}) => ({
  accountNumber: 'DT12345678',
  bankCode: 'BIDV',
  accountName: 'Nguyễn Văn Đức',
  amount: 4031.4,
  content: 'Thanh toan HD A1 dot 1',
  ...o,
});

test('link đúng dạng: giữ "@", dấu cách = "+", số tiền làm tròn, tên bỏ dấu viết hoa, url https không mã hoá', () => {
  assert.equal(
    b.bankDeeplink('mb', info()),
    'https://dl.vietqr.io/pay?app=mb&am=4031&tn=Thanh+toan+HD+A1+dot+1&ba=DT12345678@bidv&bn=NGUYEN+VAN+DUC&url=https://beesky.vn',
  );
  assert.match(b.PAY_RETURN_URL, /^https:\/\//);
});

test('ký tự đặc biệt trong nội dung được mã hoá, không có %40', () => {
  const link = b.bankDeeplink('icb', info({ content: 'HD#1&dot=2' }));
  assert.ok(link.includes('tn=HD%231%26dot%3D2&'));
  assert.ok(!link.includes('%40'));
});

test('mã ngân hàng nhận: nhận BIN, mã VietQR, tên ngắn (không phân biệt hoa thường)', () => {
  assert.equal(b.bankCodeOf('970418'), 'bidv');
  assert.equal(b.bankCodeOf('bidv'), 'bidv');
  assert.equal(b.bankCodeOf('ICB'), 'icb');
  assert.equal(b.bankCodeOf('VietinBank'), 'icb');
  assert.equal(b.bankCodeOf('MBBank'), 'mb');
  assert.equal(b.bankCodeOf('970432'), 'vpb');
});

test('ngân hàng lạ / thiếu STK → không dựng link (ẩn hàng logo)', () => {
  assert.equal(b.bankCodeOf('XYZBANK'), null);
  assert.equal(b.bankCodeOf(''), null);
  assert.equal(b.bankDeeplink('mb', info({ bankCode: '999999' })), null);
  assert.equal(b.bankDeeplink('mb', info({ accountNumber: '' })), null);
});

test('không có tên chủ TK → bỏ bn', () => {
  assert.ok(!b.bankDeeplink('mb', info({ accountName: '' })).includes('bn='));
});

test('app dùng lần trước lên đầu; đọc được object BeeHome và chuỗi appId', () => {
  assert.deepEqual(b.orderBankApps(b.BANK_APPS, 'acb').map((a) => a.appId), ['acb', 'mb', 'icb', 'bidv', 'ocb']);
  assert.deepEqual(b.orderBankApps(b.BANK_APPS, null), b.BANK_APPS);
  assert.equal(b.parseLastBankApp(JSON.stringify({ appId: 'ocb', appName: 'OCB OMNI', appLogo: 'x' })), 'ocb');
  assert.equal(b.parseLastBankApp('bidv'), 'bidv');
  assert.equal(b.parseLastBankApp(JSON.stringify({ appId: 'vpb' })), null);
  assert.equal(b.parseLastBankApp('{hỏng'), null);
  assert.equal(b.parseLastBankApp(null), null);
});

test('logo theo nền tảng', () => {
  assert.equal(b.bankAppLogo('mb', 'ios'), 'https://cdn.vietqr.io/bank-app-icon/mb-ios.webp');
  assert.equal(b.bankAppLogo('icb', 'android'), 'https://cdn.vietqr.io/bank-app-icon/icb-android.webp');
});
