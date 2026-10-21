// Phiếu thu được trừ vào đâu (lib/receiptAllocation.ts) — cùng luật fn_contract_payment_schedule. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const { allocateReceipts, summarizeReceipts } = loadModule('lib/receiptAllocation.ts');

// Dữ liệu thật HD-CT.01-0610-2026-0001 (fn_portal_app_phieu_thu_phan_bo, 2026-10-21).
const dot = [
  { dot_tt: 1, dot_tt_text: 'Đợt 1', phai_thu: 301320000, phai_thu_pbt: 0 },
  { dot_tt: 2, dot_tt_text: 'Đợt 2', phai_thu: 401760000, phai_thu_pbt: 0 },
  { dot_tt: 3, dot_tt_text: 'Đợt 3', phai_thu: 170748000, phai_thu_pbt: 20088000 },
  { dot_tt: 4, dot_tt_text: 'Đợt 4', phai_thu: 150660000, phai_thu_pbt: 0 },
];
const line = (id, dot_tt, nhom, so_tien, loai_ten) => ({ ma_phieu_id: id, dot_tt, nhom, so_tien, loai_ten });
const that = {
  chuyen_nhuong: false,
  dot,
  dong: [
    line('p09', 1, 'GOC', 328137480, 'Thu theo tiến độ'),
    line('p10', 2, 'GOC', 437516640, 'Thu theo tiến độ'),
    line('p12', 1, 'LAI', 150000000, 'Thu tiền lãi'),
    line('p13', 1, 'LAI', 1200000000, 'Thu tiền lãi'),
  ],
};

test('HĐ thật: dư đợt 1 chảy sang đợt 2, dư đợt 2 sang đợt 3 (đợt 3 đã thu 62.574.120 như lịch)', () => {
  const m = allocateReceipts(that);
  assert.deepEqual(m.get('p09').parts, [
    { label: 'Đợt 1 · tiền căn hộ', amount: 301320000 },
    { label: 'Đợt 2 · tiền căn hộ', amount: 26817480 },
  ]);
  assert.deepEqual(m.get('p10').parts, [
    { label: 'Đợt 2 · tiền căn hộ', amount: 374942520 },
    { label: 'Đợt 3 · tiền căn hộ', amount: 62574120 },
  ]);
  assert.equal(m.get('p09').typeLabel, 'Thu theo tiến độ');
});

test('phiếu tiền lãi: không trừ vào đợt nào, ghi đợt của tiền lãi', () => {
  const a = allocateReceipts(that).get('p13');
  assert.deepEqual(a.parts, []);
  assert.equal(a.interestAmount, 1200000000);
  assert.equal(a.interestLabel, 'Đợt 1');
  assert.equal(a.typeLabel, 'Thu tiền lãi');
});

test('tổng đối chiếu: 2.115.654.120 = 765.654.120 vào HĐ + 1.350.000.000 lãi', () => {
  const m = allocateReceipts(that);
  const receipts = [
    ['p09', 328137480], ['p10', 437516640], ['p12', 150000000], ['p13', 1200000000],
  ].map(([id, amount]) => ({ amount, status: 'paid', allocation: m.get(id) }));
  assert.deepEqual(summarizeReceipts(receipts), { total: 2115654120, intoContract: 765654120, interest: 1350000000, unallocated: 0 });
  assert.equal(summarizeReceipts([{ amount: 1, status: 'paid' }]), null);
});

test('phí bảo trì là dòng riêng: tiền gốc không trả PBT; phiếu PBT không gắn đợt vào PBT đợt đầu có phí', () => {
  const m = allocateReceipts({ chuyen_nhuong: false, dot, dong: [line('pbt', 0, 'PBT', 5000000, 'Phí bảo trì')] });
  assert.deepEqual(m.get('pbt').parts, [{ label: 'Đợt 3 · phí bảo trì', amount: 5000000 }]);
});

test('thu dư sau đợt cuối / gắn đợt không có trong lịch → chưa trừ vào đâu', () => {
  const total = 301320000 + 401760000 + 170748000 + 150660000;
  const m = allocateReceipts({
    chuyen_nhuong: false,
    dot,
    dong: [line('a', 0, 'GOC', total + 1000, 'Thu theo tiến độ'), line('b', 9, 'GOC', 500, 'Thu theo tiến độ')],
  });
  assert.equal(m.get('a').unallocatedAmount, 1000);
  assert.equal(m.get('b').unallocatedAmount, 500);
});

test('hợp đồng đã chuyển nhượng → không phân bổ', () => {
  const a = allocateReceipts({ ...that, chuyen_nhuong: true }).get('p09');
  assert.equal(a.transferred, true);
  assert.deepEqual(a.parts, []);
});
