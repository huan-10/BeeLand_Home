// Thanh toán QR (lib/paymentTarget.ts): khoản trả được trên từng loại phiếu — cùng quy tắc fn_portal_payment_target. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const p = loadModule('lib/paymentTarget.ts');

const contract = { id: 'pgc-1', code: 'HD-A1-1005-2026-0001', unitCode: 'A1-1005', projectName: 'BRG TOWER' };
const inst = (o = {}) => ({
  id: 'pgc-1_1', contractId: 'pgc-1', sequence: 1, name: 'Đợt 1', percentOfContract: 25, amount: 300, paidAmount: 100,
  dueDate: '2026-10-03', status: 'overdue', remainingAmount: 200, daysUntilDue: -4,
  contractCode: contract.code, projectName: contract.projectName, unitCode: contract.unitCode, ...o,
});
const base = (o = {}) => ({ contract, stage: 'HDMB', statusCode: '10', depositAmount: 0, paidAmount: 0, booking: null, nextInstallment: inst(), ...o });
const NOW = new Date('2026-10-07T07:00:00Z');

test('HĐMB (kể cả chờ duyệt) → đợt kế tiếp, số tiền = còn lại của đợt, gửi số đợt', () => {
  const t = p.recordPayTarget(base(), NOW);
  assert.equal(t.module, 'HOPDONG');
  assert.equal(t.dot, 1);
  assert.equal(t.amount, 200);
  assert.equal(t.name, 'Đợt 1');
  assert.equal(t.daysUntilDue, -4);
  assert.equal(t.contractId, 'pgc-1');
});

test('HĐ thanh lý / chờ thanh lý / huỷ hoặc không còn đợt → không thanh toán', () => {
  for (const code of ['11', '12', '16']) assert.equal(p.recordPayTarget(base({ statusCode: code }), NOW), null);
  assert.equal(p.recordPayTarget(base({ nextInstallment: null }), NOW), null);
  assert.equal(p.recordPayTarget(base({ stage: 'HDGV', nextInstallment: inst({ remainingAmount: 0 }) }), NOW), null);
});

test('đặt cọc chờ duyệt (8) → tiền cọc còn thiếu; đã duyệt (13) hoặc đã đủ → không', () => {
  const t = p.recordPayTarget(base({ stage: 'DATCOC', statusCode: '8', depositAmount: 200_000_000, paidAmount: 50_000_000, nextInstallment: null }), NOW);
  assert.deepEqual([t.module, t.dot, t.amount, t.name], ['DATCOC', null, 150_000_000, 'Tiền đặt cọc']);
  assert.equal(p.recordPayTarget(base({ stage: 'DATCOC', statusCode: '13', depositAmount: 200, nextInstallment: null }), NOW), null);
  assert.equal(p.recordPayTarget(base({ stage: 'DATCOC', statusCode: '8', depositAmount: 200, paidAmount: 200, nextInstallment: null }), NOW), null);
});

test('giữ chỗ chờ duyệt (1) → tiền giữ chỗ kèm hạn; hết hạn / đã trả / thiếu số tiền / đã duyệt → không', () => {
  const booking = { amount: 50_000_000, expiresAt: '2026-10-07T08:00:00Z' };
  const t = p.recordPayTarget(base({ stage: 'GIUCHO', statusCode: '1', booking, nextInstallment: null }), NOW);
  assert.deepEqual([t.module, t.amount, t.expiresAt, t.name], ['BOOKING', 50_000_000, '2026-10-07T08:00:00Z', 'Tiền giữ chỗ']);
  const g = (o) => p.recordPayTarget(base({ stage: 'GIUCHO', statusCode: '1', nextInstallment: null, booking, ...o }), NOW);
  assert.equal(g({ booking: { amount: 50, expiresAt: '2026-10-07T06:59:59Z' } }), null);
  assert.equal(g({ paidAmount: 50_000_000 }), null);
  assert.equal(g({ booking: { amount: 0, expiresAt: null } }), null);
  assert.equal(g({ booking: null }), null);
  assert.equal(g({ statusCode: '6' }), null);
  // Chưa biết hạn (máy chủ tính theo cài đặt bán hàng) → vẫn cho bấm
  assert.equal(g({ booking: { amount: 50, expiresAt: null } }).expiresAt, undefined);
});

test('VietQR: mã ngân hàng – số tài khoản, số tiền làm tròn, nội dung + chủ TK được mã hoá', () => {
  const url = p.vietQrUrl({ bankCode: 'BIDV', accountNumber: 'DA112345678', amount: 155417983.4, content: 'Thanh toan HD-1 Đợt 1', accountName: 'NGUYEN VAN A' });
  assert.equal(
    url,
    'https://img.vietqr.io/image/BIDV-DA112345678-compact2.png?amount=155417983&addInfo=Thanh%20toan%20HD-1%20%C4%90%E1%BB%A3t%201&accountName=NGUYEN%20VAN%20A',
  );
});

test('đã thanh toán = số tiền nhận TĂNG so với lúc mở mã (VA dùng lại có thể đã nhận tiền đợt trước)', () => {
  assert.equal(p.checkoutPaid({ paidAmount: 0 }, { paidAmount: 0 }), false);
  assert.equal(p.checkoutPaid({ paidAmount: 0 }, { paidAmount: 1000 }), true);
  assert.equal(p.checkoutPaid({ paidAmount: 5000 }, { paidAmount: 5000 }), false);
  assert.equal(p.checkoutPaid({ paidAmount: 5000 }, { paidAmount: 9000 }), true);
});

test('đếm ngược hạn giữ chỗ', () => {
  const now = Date.parse('2026-10-07T07:00:00Z');
  assert.equal(p.secondsLeft(null, now), null);
  assert.equal(p.secondsLeft('2026-10-07T07:01:05Z', now), 65);
  assert.equal(p.secondsLeft('2026-10-07T06:00:00Z', now), 0);
  assert.equal(p.formatCountdown(65), '01:05');
  assert.equal(p.formatCountdown(3725), '1:02:05');
});
