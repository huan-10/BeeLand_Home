// Phiếu thu PDF (lib/receiptPdf.ts): đọc số tiền bằng chữ (giống web numberToVietnameseWords) + HTML mẫu 01-TT. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const r = loadModule('lib/receiptPdf.ts');

test('đọc số tiền bằng chữ', () => {
  assert.equal(r.numberToVietnameseWords(200000000), 'Hai trăm triệu đồng');
  assert.equal(r.numberToVietnameseWords(1476005495), 'Một tỷ bốn trăm bảy mươi sáu triệu không trăm lẻ năm nghìn bốn trăm chín mươi lăm đồng');
  assert.equal(r.numberToVietnameseWords(21), 'Hai mươi mốt đồng');
  assert.equal(r.numberToVietnameseWords(15), 'Mười lăm đồng');
  assert.equal(r.numberToVietnameseWords(1000000), 'Một triệu đồng');
  assert.equal(r.numberToVietnameseWords(0), 'Không đồng');
});

const receipt = {
  id: 'v1_p1', code: 'PT-202609-0068', status: 'paid', contractId: 'p1', contractCode: 'HD-A1-1002-2026-0001',
  projectName: 'BRG Smart City', unitCode: 'A1-1002', amount: 200000000, paidDate: '2026-09-23', method: 'bank_transfer',
  payerName: 'Nguyễn Quang Bảo', content: 'Thu tiền đặt cọc - DC-A1-1002-2026-0038 <b>', cashier: '',
};
const company = { name: 'Công ty BRG', address: 'Hà Nội' };

test('HTML phiếu thu: đủ thông tin, số tiền + bằng chữ, chặn chèn mã', () => {
  const html = r.buildReceiptHtml(receipt, company);
  for (const s of ['PHIẾU THU', 'Mẫu số 01 - TT', 'PT-202609-0068', 'Ngày 23 tháng 09 năm 2026', 'Nguyễn Quang Bảo', 'HD-A1-1002-2026-0001', 'BRG Smart City', 'A1-1002', 'Chuyển khoản', '200.000.000', 'Hai trăm triệu đồng', 'Công ty BRG']) {
    assert.ok(html.includes(s), `thiếu: ${s}`);
  }
  assert.ok(html.includes('&lt;b&gt;') && !html.includes('0038 <b>'), 'phải escape nội dung');
});

test('tên tệp PDF an toàn', () => {
  assert.equal(r.receiptFileName('PT-202609/0068'), 'PhieuThu_PT-202609-0068.pdf');
});

test('nội dung chia sẻ dạng chữ (web không chia sẻ được tệp)', () => {
  const t = r.receiptShareText(receipt);
  assert.equal(t, 'Phiếu thu PT-202609-0068\nSố tiền: 200.000.000 đ\nNgày thu: 23/09/2026\nHợp đồng: HD-A1-1002-2026-0001 · Căn A1-1002\nNội dung: Thu tiền đặt cọc - DC-A1-1002-2026-0038 <b>');
});
