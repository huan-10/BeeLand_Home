// Đọc kết quả RPC OTP thật của app (lib/appOtp.ts — fn_portal_app_otp_gui / fn_portal_app_otp_xac_minh). Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const src = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/appOtp.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', src)(mod, mod.exports, require);
const m = mod.exports;

test('gửi mã thành công → otpId, hạn, độ dài, thời gian chờ gửi lại', () => {
  assert.deepEqual(m.parseOtpSend({ data: { otp_id: 'a', het_han: 't', do_dai_ma: 6, gui_lai_sau: 60 } }), {
    otpId: 'a',
    expiresAt: 't',
    length: 6,
    resendIn: 60,
  });
});

test('gửi mã lỗi nghiệp vụ → ném đúng câu của server', () => {
  assert.throws(() => m.parseOtpSend({ error: 'Số điện thoại chưa đăng ký tài khoản.' }), { message: 'Số điện thoại chưa đăng ký tài khoản.' });
});

test('gửi mã thiếu otp_id → lỗi chung', () => {
  assert.throws(() => m.parseOtpSend({ data: {} }), { message: 'Không thể gửi mã xác thực, vui lòng thử lại' });
  assert.throws(() => m.parseOtpSend(null), { message: 'Không thể gửi mã xác thực, vui lòng thử lại' });
});

test('xác minh thành công → số tài khoản', () => {
  assert.equal(m.parseOtpVerify({ data: { so_tai_khoan: 2 } }), 2);
});

test('xác minh lỗi → ném đúng câu của server', () => {
  assert.throws(() => m.parseOtpVerify({ error: 'Mã OTP không đúng' }), { message: 'Mã OTP không đúng' });
});

// Danh sách hồ sơ của tài khoản (fn_portal_app_ho_so_list, 2026-10-08).
test('danh sách hồ sơ → các dòng + hồ sơ đang xem', () => {
  const r = m.parseProfileList({ data: [{ id: 'k1', ten_kh: 'A', dang_xem: false }, { id: 'k2', ten_kh: 'B', dang_xem: true }] });
  assert.deepEqual(r.rows.map((x) => x.id), ['k1', 'k2']);
  assert.equal(r.activeId, 'k2');
});

test('danh sách hồ sơ lỗi → ném câu của server; rỗng → không có hồ sơ đang xem', () => {
  assert.throws(() => m.parseProfileList({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' }), {
    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  });
  assert.deepEqual(m.parseProfileList({ data: [] }), { rows: [], activeId: null });
});
