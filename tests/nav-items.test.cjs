// Thanh tab: NOXH ở giữa, Phiếu thu gộp vào Thanh toán (components/layout/navItems.ts). Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const src = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/layout/navItems.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', src)(mod, mod.exports, require);
const m = mod.exports;

test('5 tab theo thứ tự, Nhà ở XH nằm giữa', () => {
  assert.deepEqual(
    m.primaryNavItems.map((i) => i.name),
    ['index', 'contracts', 'noxh', 'payments', 'profile'],
  );
  const noxh = m.primaryNavItems.find((i) => i.name === 'noxh');
  assert.equal(noxh.label, 'Nhà ở XH');
  assert.equal(noxh.sidebarLabel, 'Nhà ở xã hội');
  assert.equal(noxh.icon, 'building');
});

test('Phiếu thu tô sáng tab Thanh toán', () => {
  assert.equal(m.activeNavName('receipts'), 'payments');
});

test('route của tab giữ nguyên tên; route phụ không thuộc tab nào', () => {
  assert.equal(m.activeNavName('noxh'), 'noxh');
  assert.equal(m.activeNavName('notifications'), 'notifications');
  assert.equal(m.activeNavName('contract/[id]'), undefined);
});
