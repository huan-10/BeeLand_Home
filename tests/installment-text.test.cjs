// Chữ phụ của mỗi đợt trong lịch thanh toán + nhãn thanh Thanh toán (lib/installmentText.ts). Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const { installmentDateText, installmentBreakdown, installmentHeadline, payTargetLabel } = loadModule('lib/installmentText.ts');

const inst = (o) => ({ status: 'scheduled', amount: 100, paidAmount: 0, remainingAmount: 100, dueDate: '2026-05-01', daysUntilDue: 10, ...o });

test('đã trả hết, có ngày trả → "Đã thanh toán ngày …"', () => {
  assert.equal(installmentDateText(inst({ status: 'paid', paidDate: '2026-04-20', daysUntilDue: -5 })), 'Đã thanh toán ngày 20/04/2026');
});

test('đã trả hết, không có ngày trả → chỉ hạn, không "Quá hạn N ngày"', () => {
  assert.equal(installmentDateText(inst({ status: 'paid', daysUntilDue: -749, dueDate: '2024-10-01' })), 'Hạn 01/10/2024');
});

test('chưa trả hết → hạn + số ngày còn lại / quá hạn', () => {
  assert.equal(installmentDateText(inst({ status: 'overdue', daysUntilDue: -172 })), 'Hạn 01/05/2026 · Quá hạn 172 ngày');
});

test('đợt 3 HĐ thật: tiền căn hộ + phí bảo trì − đã trả = còn phải trả (khớp thanh Thanh toán)', () => {
  const b = installmentBreakdown(
    inst({ status: 'overdue', amount: 190836000, maintenanceFee: 40176000, percentOfContract: 15, paidAmount: 62574120, remainingAmount: 128261880 }),
  );
  assert.deepEqual(b.lines, [
    { label: 'Tiền căn hộ (15% HĐ)', value: '150.660.000 đ' },
    { label: 'Phí bảo trì', value: '40.176.000 đ' },
  ]);
  assert.equal(b.totalText, '190.836.000 đ');
  assert.equal(b.paidText, '− 62.574.120 đ');
  assert.equal(b.remainingText, '128.261.880 đ');
});

test('có phí bảo trì, chưa trả gì → bảng kê không có dòng đã trả', () => {
  const b = installmentBreakdown(inst({ amount: 120, maintenanceFee: 20, percentOfContract: 10, remainingAmount: 120 }));
  assert.equal(b.lines.length, 2);
  assert.equal(b.paidText, null);
});

test('mọi đợt đều có bảng kê: không phí bảo trì → một dòng; đã trả hết → còn phải trả 0 đ', () => {
  assert.equal(installmentBreakdown(inst({ percentOfContract: 10 })).lines.length, 1);
  const paid = installmentBreakdown(inst({ status: 'paid', maintenanceFee: 20, paidAmount: 100, remainingAmount: 0 }));
  assert.equal(paid.lines.length, 2);
  assert.equal(paid.remainingText, '0 đ');
});

test('số chính: trả một phần → "Còn phải trả" + phần còn lại; chưa trả / đã trả hết → tổng đợt', () => {
  assert.deepEqual(installmentHeadline(inst({ amount: 190836000, paidAmount: 62574120, remainingAmount: 128261880 })), {
    label: 'Còn phải trả',
    amountText: '128.261.880 đ',
  });
  assert.deepEqual(installmentHeadline(inst({})), { label: null, amountText: '100 đ' });
  assert.deepEqual(installmentHeadline(inst({ status: 'paid', paidAmount: 100, remainingAmount: 0 })), { label: null, amountText: '100 đ' });
});

test('thanh Thanh toán: đợt HĐ ghi "Còn phải trả · Đợt N", khoản khác giữ tên', () => {
  assert.equal(payTargetLabel({ module: 'HOPDONG', name: 'Đợt 3' }), 'Còn phải trả · Đợt 3');
  assert.equal(payTargetLabel({ module: 'DATCOC', name: 'Tiền đặt cọc' }), 'Tiền đặt cọc');
});
