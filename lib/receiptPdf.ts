/**
 * Phiếu thu PDF dựng trên máy (thuần, có test `tests/receipt-pdf.test.cjs`):
 * theo Mẫu số 01-TT (Thông tư 200/2014/TT-BTC) như web beeland `utils/printReceiptTT200.ts`,
 * đọc số tiền bằng chữ như web `utils/numberToVietnameseWords.ts`.
 * Màu trong HTML dùng tên màu CSS (không mã hex) — đây là tài liệu in đen trắng, không theo theme app.
 */
import type { Receipt } from '@/types';

import { formatNumber } from './format';
import { paymentMethodLabels } from './labels';

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readTriple(n: number, full: boolean): string {
  const tr = Math.floor(n / 100);
  const ch = Math.floor((n % 100) / 10);
  const dv = n % 10;
  const parts: string[] = [];
  if (full || tr > 0) parts.push(`${DIGITS[tr]} trăm`);
  if (ch > 1) {
    parts.push(`${DIGITS[ch]} mươi`);
    if (dv === 1) parts.push('mốt');
    else if (dv === 5) parts.push('lăm');
    else if (dv > 0) parts.push(DIGITS[dv] ?? '');
  } else if (ch === 1) {
    parts.push('mười');
    if (dv === 5) parts.push('lăm');
    else if (dv > 0) parts.push(DIGITS[dv] ?? '');
  } else if (dv > 0) {
    parts.push(full || tr > 0 ? `lẻ ${DIGITS[dv]}` : (DIGITS[dv] ?? ''));
  }
  return parts.join(' ').trim();
}

/** 200000000 → "Hai trăm triệu đồng". */
export function numberToVietnameseWords(num: number): string {
  const n = Math.floor(Math.abs(num || 0));
  if (n === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ'];
  const groups: number[] = [];
  for (let t = n; t > 0; t = Math.floor(t / 1000)) groups.push(t % 1000);
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i] ?? 0;
    if (g === 0) continue;
    const text = readTriple(g, i < groups.length - 1);
    if (text) parts.push(`${text}${units[i] ? ` ${units[i]}` : ''}`);
  }
  const result = parts.join(' ').trim();
  return `${result.charAt(0).toUpperCase()}${result.slice(1)} đồng`;
}

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** "PhieuThu_PT-202609-0068.pdf" (ký tự lạ → "-"). */
export function receiptFileName(code: string): string {
  return `PhieuThu_${code.replace(/[^\w.-]+/g, '-')}.pdf`;
}

export interface ReceiptCompany {
  name: string;
  address: string;
}

/** HTML phiếu thu A4 (Mẫu 01-TT) cho `expo-print` / cửa sổ in trên web. */
export function buildReceiptHtml(r: Receipt, company: ReceiptCompany): string {
  const [y = '', m = '', d = ''] = r.paidDate.slice(0, 10).split('-');
  const words = numberToVietnameseWords(r.amount);
  const row = (label: string, value: string, extra = '') =>
    `<div class="row"><span class="label">${label}</span><span class="value${extra}">${value || '&nbsp;'}</span></div>`;
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Phiếu thu ${esc(r.code)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Times, serif; font-size: 13pt; color: black; margin: 0; padding: 8px; }
  .header { display: flex; justify-content: space-between; gap: 16px; }
  .header .left { flex: 1; }
  .header .right { flex: 1; text-align: center; font-style: italic; font-size: 11pt; }
  .header .right b { font-style: normal; }
  .title { text-align: center; margin-top: 16px; }
  .title h1 { font-size: 20pt; margin: 6px 0 2px; letter-spacing: 1px; }
  .title .date { font-style: italic; }
  .meta { text-align: right; margin: 6px 0 14px; font-size: 12pt; }
  .row { margin: 7px 0; line-height: 1.55; display: flex; gap: 8px; }
  .row .label { min-width: 180px; }
  .row .value { flex: 1; border-bottom: 1px dotted dimgray; padding: 0 4px; }
  .row .strong { font-weight: bold; }
  .row .italic { font-style: italic; }
  .signs { display: flex; justify-content: space-between; margin-top: 30px; text-align: center; font-size: 12pt; }
  .signs .col { flex: 1; }
  .signs .role { font-weight: bold; }
  .signs .hint { font-style: italic; font-size: 10.5pt; margin-top: 2px; }
  .signs .space { height: 72px; padding-top: 52px; }
  .note { margin-top: 28px; font-size: 10.5pt; font-style: italic; color: dimgray; text-align: center; }
</style></head>
<body>
  <div class="header">
    <div class="left">
      <div><b>Đơn vị:</b> ${esc(company.name)}</div>
      <div><b>Địa chỉ:</b> ${esc(company.address)}</div>
    </div>
    <div class="right"><b>Mẫu số 01 - TT</b><br/>(Ban hành theo Thông tư số 200/2014/TT-BTC<br/>Ngày 22/12/2014 của Bộ Tài chính)</div>
  </div>
  <div class="title">
    <h1>PHIẾU THU</h1>
    <div class="date">Ngày ${esc(d)} tháng ${esc(m)} năm ${esc(y)}</div>
  </div>
  <div class="meta">Số: <b>${esc(r.code)}</b></div>
  ${row('Họ và tên người nộp tiền:', esc(r.payerName))}
  ${row('Hợp đồng:', esc(r.contractCode))}
  ${row('Dự án / Căn:', esc([r.projectName, r.unitCode].filter(Boolean).join(' · ')))}
  ${row('Lý do nộp:', esc(r.content))}
  ${row('Hình thức:', esc(paymentMethodLabels[r.method]))}
  ${row('Số tiền:', `${formatNumber(r.amount)} VNĐ`, ' strong')}
  ${row('(Viết bằng chữ):', esc(words), ' italic')}
  <div class="signs">
    <div class="col"><div class="role">Người nộp tiền</div><div class="hint">(Ký, họ tên)</div><div class="space">${esc(r.payerName)}</div></div>
    <div class="col"><div class="role">Người lập phiếu</div><div class="hint">(Ký, họ tên)</div><div class="space"></div></div>
    <div class="col"><div class="role">Thủ quỹ</div><div class="hint">(Ký, họ tên)</div><div class="space">${esc(r.cashier)}</div></div>
  </div>
  <div class="note">Bản phiếu thu điện tử tạo từ ứng dụng BeeSky để tra cứu — không thay thế liên phiếu thu có chữ ký, đóng dấu của chủ đầu tư.</div>
</body></html>`;
}

/** Tóm tắt phiếu thu dạng chữ để chia sẻ (khi không gửi được tệp, ví dụ trình duyệt). */
export function receiptShareText(r: Receipt): string {
  const [y = '', m = '', d = ''] = r.paidDate.slice(0, 10).split('-');
  return [
    `Phiếu thu ${r.code}`,
    `Số tiền: ${formatNumber(r.amount)} đ`,
    `Ngày thu: ${d}/${m}/${y}`,
    `Hợp đồng: ${r.contractCode}${r.unitCode ? ` · Căn ${r.unitCode}` : ''}`,
    r.content ? `Nội dung: ${r.content}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
