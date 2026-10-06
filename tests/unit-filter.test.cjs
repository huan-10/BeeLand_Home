// Lọc theo mã căn dùng chung cho Hợp đồng / Lịch thanh toán / Phiếu thu (lib/unitFilter.ts). Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const src = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/unitFilter.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', src)(mod, mod.exports, require);
const { unitCodesOf, filterByUnit, activeUnit } = mod.exports;

const rows = [
  { id: 1, unitCode: 'GS53008' },
  { id: 2, unitCode: 'SA50922' },
  { id: 3, unitCode: 'GS53008' },
  { id: 4, unitCode: ' A10 ' },
  { id: 5, unitCode: 'A9' },
  { id: 6, unitCode: '' },
];

test('mã căn: bỏ trùng, bỏ trống, sắp tự nhiên (A9 trước A10)', () => {
  assert.deepEqual(unitCodesOf(rows), ['A9', 'A10', 'GS53008', 'SA50922']);
});

test('lọc theo căn; null → giữ nguyên', () => {
  assert.deepEqual(filterByUnit(rows, 'GS53008').map((r) => r.id), [1, 3]);
  assert.deepEqual(filterByUnit(rows, 'A10').map((r) => r.id), [4]);
  assert.equal(filterByUnit(rows, null).length, rows.length);
});

test('căn đang chọn không còn trong dữ liệu → về Tất cả', () => {
  assert.equal(activeUnit(['A9', 'A10'], 'A10'), 'A10');
  assert.equal(activeUnit(['A9'], 'A10'), null);
  assert.equal(activeUnit(['A9'], null), null);
});
