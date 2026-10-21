// Lịch lưu trên phiếu khi máy chủ chưa trả lịch (services/supabase/customerDomain.ts › fallbackSchedule). Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const { buildInstallments } = loadModule('services/supabase/customerDomain.ts');

// Lịch thật HD-CT.01-0610 (đợt 3 có phí bảo trì).
const lich = [
  { DotTT: 1, NgayTT: '2024-09-30', TyLeTT: 30, PhaiThu: 301320000 },
  { DotTT: 2, NgayTT: '2025-10-31', TyLeTT: 40, PhaiThu: 401760000 },
  { DotTT: 3, NgayTT: '2026-04-30', TyLeTT: 15, PhaiThu: 170748000, PhiBT: 20088000 },
  { DotTT: 4, NgayTT: '2026-08-27', TyLeTT: 15, PhaiThu: 150660000 },
];
const rec = (daThu) => ({ row: { id: 'pgc', da_thu: daThu, lich_thanh_toan: lich } });
const paid = (daThu) => buildInstallments(rec(daThu), []).map((i) => i.paidAmount);

test('trả theo thứ tự đợt → khớp fn_contract_payment_schedule (đợt 3 trả 62.574.120)', () => {
  assert.deepEqual(paid(765654120), [301320000, 401760000, 62574120, 0]);
});

test('PBT của đợt được trừ ngay sau gốc của chính đợt đó, không dồn về cuối', () => {
  // Đủ gốc + PBT đợt 3, dư 1.000.000 sang đợt 4.
  assert.deepEqual(paid(301320000 + 401760000 + 170748000 + 20088000 + 1000000), [301320000, 401760000, 190836000, 1000000]);
});

test('lấy "Phải thu" trước "Số tiền" như máy chủ; đợt có PBT ghi phí bảo trì riêng', () => {
  const r = { row: { id: 'pgc', da_thu: 0, lich_thanh_toan: [{ DotTT: 1, NgayTT: '2026-01-01', PhaiThu: 100, SoTien: 999, PhiBT: 10 }] } };
  const [i] = buildInstallments(r, []);
  assert.equal(i.amount, 110);
  assert.equal(i.maintenanceFee, 10);
});
