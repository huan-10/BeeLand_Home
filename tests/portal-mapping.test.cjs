// Ánh xạ dữ liệu database dùng chung → kiểu của app (lib/portalMapping.ts). Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const src = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/portalMapping.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', src)(mod, mod.exports, require);
const m = mod.exports;

test('giai đoạn phiếu → loại hợp đồng', () => {
  assert.equal(m.contractTypeFromStage('HDMB'), 'purchase');
  assert.equal(m.contractTypeFromStage('hdgv'), 'purchase');
  assert.equal(m.contractTypeFromStage('THANHLY'), 'purchase');
  assert.equal(m.contractTypeFromStage('DATCOC'), 'deposit');
  assert.equal(m.contractTypeFromStage('GIUCHO'), 'reservation');
  assert.equal(m.contractTypeFromStage(null), 'reservation');
});

test('mã trạng thái pgc_trang_thai → 4 nhóm', () => {
  for (const c of ['11', '16']) assert.equal(m.contractStatusFromCode(c), 'cancelled');
  for (const c of ['19', '21']) assert.equal(m.contractStatusFromCode(c), 'completed');
  for (const c of ['6', '13', '14', '15', '17', '18', '22']) assert.equal(m.contractStatusFromCode(c), 'active');
  for (const c of ['1', '7', '8', '9', '10', '12', '20', '', null]) assert.equal(m.contractStatusFromCode(c), 'pending');
});

test('mã căn → toà / tầng', () => {
  assert.deepEqual(m.parseUnitCode('A1-1107'), { block: 'A1', floor: 11 });
  assert.deepEqual(m.parseUnitCode('A1-12A01'), { block: 'A1', floor: 12 });
  assert.deepEqual(m.parseUnitCode('B2-0805'), { block: 'B2', floor: 8 });
  assert.deepEqual(m.parseUnitCode('LK-05'), { block: '', floor: 0 });
  assert.deepEqual(m.parseUnitCode('A1-1107', '15'), { block: 'A1', floor: 15 });
});

test('ngày, tiền, hình thức thu', () => {
  assert.equal(m.dateOnly('2026-10-04T00:00:00+07:00'), '2026-10-04');
  assert.equal(m.dateOnly(null), '');
  assert.equal(m.money(473250667.175), 473250667);
  assert.equal(m.money('abc'), 0);
  assert.equal(m.paymentMethodFromText('Chuyển khoản'), 'bank_transfer');
  assert.equal(m.paymentMethodFromText('Tiền mặt'), 'cash');
  assert.equal(m.paymentMethodFromText('Quẹt thẻ POS'), 'card');
});
