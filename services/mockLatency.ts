/**
 * Giả lập độ trễ mạng 300–600ms cho dữ liệu mock.
 * Xóa file này khi tất cả services đã gọi API thật.
 */
export function simulateLatency(min = 300, max = 600): Promise<void> {
  const ms = Math.floor(min + Math.random() * (max - min));
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Sao chép sâu để màn hình không vô tình sửa vào dữ liệu mock gốc. */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
