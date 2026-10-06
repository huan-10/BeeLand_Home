// Màn Thanh toán gộp: tab Cần thanh toán (lịch) + Đã thanh toán (phiếu thu), lọc căn chung (lib/paymentsView.ts). Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const { buildPaymentsView } = loadModule('lib/paymentsView.ts');

const inst = (id, unitCode, status, remainingAmount, dueDate, paidAmount = 0) => ({
  id, unitCode, status, remainingAmount, paidAmount, dueDate, daysUntilDue: 0, amount: remainingAmount + paidAmount,
});
const rec = (id, unitCode, status, amount, paidDate) => ({ id, unitCode, status, amount, paidDate });

const installments = [
  inst('i1', 'A-1203', 'upcoming', 500, '2026-10-15'),
  inst('i2', 'C-1507', 'overdue', 50, '2026-09-25'),
  inst('i3', 'A-1203', 'paid', 0, '2026-08-01', 300),
];
const receipts = [
  rec('r1', 'A-1203', 'paid', 300, '2026-08-01'),
  rec('r2', 'RG-0712', 'paid', 100, '2026-09-01'),
  rec('r3', 'A-1203', 'cancelled', 999, '2026-09-10'),
];

test('tất cả căn: cần trả = đợt chưa trả (hạn gần trước), đã trả = phiếu thu (mới trước)', () => {
  const v = buildPaymentsView(installments, receipts, null);
  assert.deepEqual(v.units, ['A-1203', 'C-1507', 'RG-0712']);
  assert.equal(v.unit, null);
  assert.deepEqual(v.due.map((i) => i.id), ['i2', 'i1']);
  assert.deepEqual(v.dueGroups.map((g) => g.key), ['2026-09', '2026-10']);
  assert.deepEqual(v.receipts.map((r) => r.id), ['r3', 'r2', 'r1']);
  assert.deepEqual(v.summary, { dueAmount: 550, dueCount: 2, overdueAmount: 50, overdueCount: 1, paidTotal: 400, receiptCount: 3 });
});

test('chọn căn: cả hai tab và số liệu theo căn', () => {
  const v = buildPaymentsView(installments, receipts, 'A-1203');
  assert.equal(v.unit, 'A-1203');
  assert.deepEqual(v.due.map((i) => i.id), ['i1']);
  assert.deepEqual(v.receipts.map((r) => r.id), ['r3', 'r1']);
  assert.deepEqual(v.summary, { dueAmount: 500, dueCount: 1, overdueAmount: 0, overdueCount: 0, paidTotal: 300, receiptCount: 2 });
});

test('căn chỉ có phiếu thu vẫn lọc được (không bị coi là căn lạ)', () => {
  const v = buildPaymentsView(installments, receipts, 'RG-0712');
  assert.equal(v.unit, 'RG-0712');
  assert.equal(v.due.length, 0);
  assert.deepEqual(v.receipts.map((r) => r.id), ['r2']);
});

test('căn không còn trong dữ liệu → về tất cả', () => {
  assert.equal(buildPaymentsView(installments, receipts, 'Z-1').unit, null);
});

test('tóm tắt quá hạn cho Trang chủ: số đợt, tổng còn phải trả, hạn sớm nhất; không có → null', () => {
  const { overdueSummary } = loadModule('lib/payment.ts');
  const items = [
    { remainingAmount: 155417983, dueDate: '2026-10-03' },
    { remainingAmount: 331061508, dueDate: '2026-09-28' },
    { remainingAmount: 520478948, dueDate: '2026-10-03' },
  ];
  assert.deepEqual(overdueSummary(items), { count: 3, amount: 1006958439, earliestDue: '2026-09-28' });
  assert.equal(overdueSummary([]), null);
});
