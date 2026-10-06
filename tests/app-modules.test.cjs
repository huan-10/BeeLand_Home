// Tuỳ chỉnh chức năng Trang chủ (lib/appModules.ts): chuẩn hoá dữ liệu lưu, thêm / bỏ / đổi thứ tự. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const m = loadModule('lib/appModules.ts');

test('danh mục: mã không trùng, mặc định là 4 chức năng bất động sản', () => {
  const ids = m.APP_MODULES.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(m.DEFAULT_HOME_MODULES, ['contracts', 'payments', 'handover', 'handover-schedule']);
  assert.equal(m.HOME_MODULE_MAX, 8);
});

test('chuẩn hoá dữ liệu lưu: bỏ mã lạ / trùng, tối đa 8, rỗng hoặc hỏng → mặc định', () => {
  assert.deepEqual(m.normalizeHomeModules(['payments', 'xxx', 'payments', 'noxh']), ['payments', 'noxh']);
  assert.deepEqual(m.normalizeHomeModules([]), m.DEFAULT_HOME_MODULES);
  assert.deepEqual(m.normalizeHomeModules('hỏng'), m.DEFAULT_HOME_MODULES);
  assert.deepEqual(m.normalizeHomeModules(null), m.DEFAULT_HOME_MODULES);
  const all = m.APP_MODULES.map((x) => x.id);
  assert.equal(m.normalizeHomeModules(all).length, 8);
});

test('thêm (cuối, không quá 8, không trùng) / bỏ (giữ tối thiểu 1)', () => {
  assert.deepEqual(m.addHomeModule(['contracts'], 'noxh'), ['contracts', 'noxh']);
  assert.deepEqual(m.addHomeModule(['contracts'], 'contracts'), ['contracts']);
  const eight = m.APP_MODULES.slice(0, 8).map((x) => x.id);
  assert.deepEqual(m.addHomeModule(eight, m.APP_MODULES[9].id), eight);
  assert.deepEqual(m.removeHomeModule(['contracts', 'noxh'], 'contracts'), ['noxh']);
  assert.deepEqual(m.removeHomeModule(['contracts'], 'contracts'), ['contracts']);
});

test('đổi thứ tự lên / xuống; đầu / cuối danh sách thì giữ nguyên', () => {
  const ids = ['contracts', 'payments', 'handover'];
  assert.deepEqual(m.moveHomeModule(ids, 'payments', -1), ['payments', 'contracts', 'handover']);
  assert.deepEqual(m.moveHomeModule(ids, 'payments', 1), ['contracts', 'handover', 'payments']);
  assert.deepEqual(m.moveHomeModule(ids, 'contracts', -1), ids);
  assert.deepEqual(m.moveHomeModule(ids, 'handover', 1), ids);
});
