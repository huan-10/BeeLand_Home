// services/supabase/portalPayment.ts (client giả — không gọi server): chặn theo nghiệp vụ → PaymentBlockedError, mã QR đọc đúng. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule, stubModule } = require('./noxh-fixtures.cjs');

let reply = {};
const sent = [];
stubModule('services/supabase/client.ts', {
  edge: async (fn, body) => {
    sent.push([fn, body]);
    return reply;
  },
  rpc: async () => reply,
  str: (v) => (typeof v === 'string' ? v : v == null ? '' : String(v)),
});
const errors = loadModule('services/errors.ts');
const pp = loadModule('services/supabase/portalPayment.ts');

test('dự án chưa có tài khoản nhận tiền / chờ ban quản lý → PaymentBlockedError kèm lý do + thông điệp máy chủ', async () => {
  for (const code of ['NO_PAYMENT_ACCOUNT', 'WAIT_FOR_STAFF']) {
    reply = { error: `msg-${code}`, code };
    await assert.rejects(pp.startCheckout('tok', 'pgc', 1, 'HD'), (e) => e instanceof pp.PaymentBlockedError && e.reason === code && e.message === `msg-${code}`);
  }
});

test('lỗi khác → ServiceError thường; edge chưa triển khai → "chưa được bật"', async () => {
  reply = { error: 'Đợt này đã được thanh toán đủ' };
  await assert.rejects(pp.startCheckout('tok', 'pgc', 1, 'HD'), (e) => e instanceof errors.ServiceError && !(e instanceof pp.PaymentBlockedError) && e.message === 'Đợt này đã được thanh toán đủ');
  reply = { error: 'Function not found' };
  await assert.rejects(pp.startCheckout('tok', 'pgc', 1, 'HD'), { message: pp.PAYMENT_NOT_ENABLED });
});

test('mã QR: gửi token + phiếu + đợt (không gửi số tiền); đọc VA trả về', async () => {
  sent.length = 0;
  reply = { data: { va: { id: 'va1', module: 'HOPDONG', bank_code: 'BIDV', account_number: 'BSK1', account_name: 'A', amount: 314024040, content: 'Thanh toan', paid_amount: 5 }, target: { label: 'Đợt 1', so_phieu: 'HD-1' } } };
  const c = await pp.startCheckout('tok', 'pgc', 1, 'HD-x');
  assert.deepEqual(sent[0], ['portal-payment', { action: 'start', token: 'tok', pgc_id: 'pgc', dot: 1 }]);
  assert.deepEqual([c.vaId, c.bankCode, c.accountNumber, c.amount, c.paidAmount, c.label, c.contractCode, c.expiresAt], ['va1', 'BIDV', 'BSK1', 314024040, 5, 'Đợt 1', 'HD-1', null]);
});
