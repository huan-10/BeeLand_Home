import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { ServiceError } from './errors';

/**
 * iOS / Android: tải ảnh VietQR về bộ nhớ đệm rồi mở bảng chia sẻ ("Lưu hình ảnh", Zalo, ngân hàng…).
 * Trả thông báo cho toast ('' = giao diện hệ thống đã tự phản hồi).
 */
export async function saveQrImage(url: string, fileName: string): Promise<string> {
  if (!(await Sharing.isAvailableAsync())) throw new ServiceError('Thiết bị không hỗ trợ lưu / chia sẻ ảnh.');
  let file: File;
  try {
    file = await File.downloadFileAsync(url, new File(Paths.cache, fileName), { idempotent: true });
  } catch {
    throw new ServiceError('Không tải được ảnh mã QR. Vui lòng kiểm tra mạng và thử lại.', 'NETWORK');
  }
  await Sharing.shareAsync(file.uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Lưu mã QR thanh toán' });
  return '';
}
