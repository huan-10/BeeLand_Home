const DAY_MS = 24 * 60 * 60 * 1000;

/** Đọc chuỗi `yyyy-MM-dd` (hoặc ISO đầy đủ) thành Date theo giờ địa phương. */
export function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return new Date(value);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Số ngày từ `from` tới `to` (âm nếu `to` đã qua). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function daysUntil(value: string | Date, today: Date = new Date()): number {
  return daysBetween(today, parseDate(value));
}
