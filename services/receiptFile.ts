import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { ServiceError } from './errors';
import type { ReceiptDocument } from './receiptService';

/** iOS / Android: HTML → PDF trong bộ nhớ đệm, đặt tên "PhieuThu_<số>.pdf" để tệp gửi đi dễ nhận ra. */
async function renderPdf(doc: ReceiptDocument): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html: doc.html });
  const target = new File(Paths.cache, doc.fileName);
  if (target.exists) target.delete();
  await new File(uri).copy(target);
  return target.uri;
}

async function shareFile(uri: string, dialogTitle: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new ServiceError('Thiết bị không hỗ trợ lưu / chia sẻ tệp.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle });
}

/**
 * Tải PDF. Android: hộp in hệ thống → "Lưu dưới dạng PDF" (vào Tải xuống). iOS: bảng chia sẻ có "Lưu vào Tệp".
 * Trả thông báo cho toast ('' = giao diện hệ thống đã tự phản hồi).
 */
export async function saveReceiptPdf(doc: ReceiptDocument): Promise<string> {
  if (Platform.OS === 'android') {
    await Print.printAsync({ html: doc.html });
    return '';
  }
  await shareFile(await renderPdf(doc), `Lưu ${doc.fileName}`);
  return '';
}

/** Chia sẻ tệp PDF phiếu thu (Zalo, Mail, Tin nhắn…). */
export async function shareReceiptPdf(doc: ReceiptDocument): Promise<string> {
  await shareFile(await renderPdf(doc), `Chia sẻ phiếu thu ${doc.receipt.code}`);
  return '';
}
