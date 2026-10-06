// JWT tài khoản hệ thống lưu đệm (lib/serviceJwtCache.ts). Chạy: npm test
// Lỗi 2026-10-05: JWT cũ của tài khoản công ty BRG (lấy trước khi .env.local đổi sang beesky1) còn hạn 7 ngày
// → app chỉ tra được khách BRG, không thấy hồ sơ MSR cùng SĐT.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const src = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/serviceJwtCache.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', src)(mod, mod.exports, require);
const m = mod.exports;

const NOW = Date.parse('2026-10-05T03:00:00Z');
const HOUR = 60 * 60 * 1000;
const beesky1 = m.serviceAccountKey({ company: 'beesky1', email: 'admin' });
const brg = m.serviceAccountKey({ company: 'brg', email: 'admin' });

test('JWT còn hạn của đúng tài khoản → dùng lại', () => {
  const raw = m.serializeServiceJwt({ jwt: 'jwt-1', expiresAt: NOW + 2 * HOUR, account: beesky1 });
  assert.equal(m.readServiceJwt(raw, beesky1, NOW), 'jwt-1');
});

test('JWT của tài khoản khác (đổi .env.local) → bỏ, dù còn hạn', () => {
  const raw = m.serializeServiceJwt({ jwt: 'jwt-brg', expiresAt: NOW + 4 * 24 * HOUR, account: brg });
  assert.equal(m.readServiceJwt(raw, beesky1, NOW), null);
});

test('JWT lưu bởi bản cũ (không ghi tài khoản) → bỏ', () => {
  const raw = JSON.stringify({ jwt: 'jwt-old', expiresAt: NOW + 4 * 24 * HOUR });
  assert.equal(m.readServiceJwt(raw, beesky1, NOW), null);
});

test('JWT sắp hết hạn (< 5 phút) hoặc dữ liệu hỏng → bỏ', () => {
  const raw = m.serializeServiceJwt({ jwt: 'jwt-1', expiresAt: NOW + 4 * 60 * 1000, account: beesky1 });
  assert.equal(m.readServiceJwt(raw, beesky1, NOW), null);
  assert.equal(m.readServiceJwt('{hỏng', beesky1, NOW), null);
  assert.equal(m.readServiceJwt(null, beesky1, NOW), null);
});

test('khoá tài khoản không phân biệt hoa thường / khoảng trắng', () => {
  assert.equal(m.serviceAccountKey({ company: ' BeeSky1 ', email: 'Admin' }), beesky1);
});
