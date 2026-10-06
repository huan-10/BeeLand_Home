// Quyền của khách theo trạng thái hồ sơ (lib/noxh.ts → applicationQuyen) — service mock dùng cùng luật máy chủ. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, doc, submitted } = require('./noxh-fixtures.cjs');

const m = load('lib/noxh.ts');

test('nháp khách tự tạo, đợt đang mở → sửa, nộp, xoá được', () => {
  const docs = [doc(), submitted()];
  const q = m.applicationQuyen('NHAP', 'PORTAL', docs, true, null);
  assert.equal(q.nop, true);
  assert.equal(q.xoa, true);
  assert.equal(q.sua_thong_tin, true);
  assert.deepEqual(q.sua_giay_to, docs.map((d) => d.id));
  assert.equal(q.gui_bo_sung, false);
});

test('nháp khi đợt đã đóng → không nộp được', () => {
  assert.equal(m.applicationQuyen('NHAP', 'PORTAL', [doc()], false, null).nop, false);
});

test('cần bổ sung → chỉ tải giấy tờ chưa đạt / chưa nộp và giấy tờ vừa tải trong đợt bổ sung', () => {
  const bad = submitted({ trang_thai: 'CHUA_DAT', ly_do: 'Mờ' });
  const none = doc();
  const ok = submitted({ trang_thai: 'DAT' });
  const fresh = submitted({ ngay_nop: '2026-10-04T09:00:00Z' });
  const old = submitted({ ngay_nop: '2026-09-20T09:00:00Z' });
  const q = m.applicationQuyen('CAN_BO_SUNG', 'PORTAL', [bad, none, ok, fresh, old], true, '2026-10-03T08:00:00Z');
  assert.deepEqual(q.sua_giay_to, [bad.id, none.id, fresh.id]);
  assert.equal(q.gui_bo_sung, true);
  assert.equal(q.nop, false);
  assert.equal(q.xoa, false);
});

test('đang kiểm tra → chỉ xem', () => {
  assert.deepEqual(m.applicationQuyen('DANG_THAM_DINH', 'PORTAL', [doc()], true, null), {
    sua_thong_tin: false,
    sua_giay_to: [],
    nop: false,
    gui_bo_sung: false,
    xoa: false,
  });
});

test('spinGuard: chỉ bốc thăm khi đang mở, đã đồng ý quy định và không đang quay', () => {
  assert.equal(m.spinGuard('open', true, false), true);
  assert.equal(m.spinGuard('open', false, false), false);
  assert.equal(m.spinGuard('open', true, true), false);
  assert.equal(m.spinGuard('upcoming', true, false), false);
  assert.equal(m.spinGuard('spun', true, false), false);
});
