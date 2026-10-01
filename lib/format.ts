import { parseDate } from './date';

const pad = (n: number) => String(n).padStart(2, '0');

/** Nhóm hàng nghìn bằng dấu chấm: 2500000000 → "2.500.000.000". */
export function formatNumber(value: number): string {
  const sign = value < 0 ? '-' : '';
  const digits = Math.round(Math.abs(value)).toString();
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Định dạng tiền VNĐ: 2500000000 → "2.500.000.000 đ". */
export function formatCurrency(value: number): string {
  return `${formatNumber(value)} đ`;
}

/** Dạng rút gọn cho không gian hẹp: 2500000000 → "2,5 tỷ", 375000000 → "375 triệu". */
export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  const fmt = (n: number) => (Math.round(n * 100) / 100).toString().replace('.', ',');
  if (abs >= 1_000_000_000) return `${fmt(value / 1_000_000_000)} tỷ`;
  if (abs >= 1_000_000) return `${fmt(value / 1_000_000)} triệu`;
  return formatCurrency(value);
}

/** Định dạng ngày dd/MM/yyyy. */
export function formatDate(value: string | Date): string {
  const date = parseDate(value);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Định dạng ngày giờ dd/MM/yyyy HH:mm. */
export function formatDateTime(value: string | Date): string {
  const date = parseDate(value);
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Mô tả thời hạn thân thiện: "Còn 14 ngày", "Hôm nay", "Quá hạn 6 ngày". */
export function formatDaysLeft(days: number): string {
  if (days === 0) return 'Đến hạn hôm nay';
  if (days > 0) return `Còn ${days} ngày`;
  return `Quá hạn ${Math.abs(days)} ngày`;
}

/** Thời gian tương đối cho thông báo. */
export function formatRelativeTime(value: string | Date, now: Date = new Date()): string {
  const date = parseDate(value);
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatDate(date);
}

/** Lấy chữ cái đầu để làm avatar: "Nguyễn Văn An" → "NA". */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/** "Thứ Tư, 01/10/2026". */
export function formatWeekdayDate(value: string | Date = new Date()): string {
  const date = parseDate(value);
  return `${WEEKDAYS[date.getDay()]}, ${formatDate(date)}`;
}

/** "Tháng 10/2026". */
export function formatMonthYear(value: string | Date): string {
  const date = parseDate(value);
  return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
}
