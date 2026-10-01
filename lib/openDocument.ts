import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

/**
 * Mở tệp PDF trên iOS/Android: tệp cục bộ → trình xem hệ thống (chia sẻ/Quick Look);
 * URL http(s) → trình duyệt trong ứng dụng.
 */
export async function openDocument(url: string, title: string): Promise<void> {
  if (url.startsWith('file://') && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(url, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}
