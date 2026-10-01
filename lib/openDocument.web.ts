/** Web: mở PDF trong tab mới (trình xem PDF của trình duyệt). */
export async function openDocument(url: string, _title: string): Promise<void> {
  window.open(url, '_blank', 'noopener,noreferrer');
}
