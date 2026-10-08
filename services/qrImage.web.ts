/** Web: tải ảnh VietQR về máy (thẻ <a download>); trình duyệt chặn tải chéo nguồn → mở ảnh ở tab mới. */
export async function saveQrImage(url: string, fileName: string): Promise<string> {
  try {
    const blob = await (await fetch(url)).blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    return 'Đã tải mã QR về máy.';
  } catch {
    window.open(url, '_blank', 'noopener');
    return 'Đã mở ảnh mã QR ở thẻ mới.';
  }
}
