import * as Clipboard from 'expo-clipboard';

import type { ReceiptDocument } from './receiptService';

/** Web: in phiếu trong iframe ẩn (không bị chặn cửa sổ bật lên) → người dùng chọn "Lưu thành PDF". */
export async function saveReceiptPdf(doc: ReceiptDocument): Promise<string> {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) {
    frame.remove();
    return 'Trình duyệt không mở được bản in.';
  }
  win.document.open();
  win.document.write(doc.html);
  win.document.close();
  win.document.title = doc.fileName.replace(/\.pdf$/, '');
  await new Promise((r) => setTimeout(r, 300));
  win.focus();
  win.print();
  setTimeout(() => frame.remove(), 60_000);
  return 'Chọn "Lưu thành PDF" trong hộp in để tải phiếu thu.';
}

/** Web: chia sẻ của trình duyệt (điện thoại); không có → sao chép thông tin phiếu. */
export async function shareReceiptPdf(doc: ReceiptDocument): Promise<string> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: `Phiếu thu ${doc.receipt.code}`, text: doc.shareText });
      return '';
    } catch {
      // Người dùng huỷ → không báo lỗi.
      return '';
    }
  }
  await Clipboard.setStringAsync(doc.shareText);
  return 'Đã sao chép thông tin phiếu thu.';
}
