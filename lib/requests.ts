/**
 * Yêu cầu khách hàng — logic thuần (có test `tests/requests.test.cjs`).
 * Máy chủ: `fn_portal_my_requests` (danh sách + lịch sử, KHÔNG có ghi chú nội bộ), `fn_portal_request_create`
 * (tiêu đề 3–300 ký tự, nội dung ≤ 5000, ≤ 5 tệp, 10 yêu cầu / khách / 24 giờ). Xem web
 * `docs-claude/08-features/customer-requests.md`.
 */
import type { Tone } from '@/theme';
import type { CustomerRequest } from '@/types';

/** Giới hạn trên app (gọn hơn giới hạn máy chủ 300 / 5000). */
export const REQUEST_TITLE_MAX = 150;
export const REQUEST_CONTENT_MAX = 1000;
export const REQUEST_FILES_MAX = 5;
export const REQUEST_FILE_MAX_MB = 10;

export const REQUEST_NOT_ENABLED = 'Tính năng gửi yêu cầu chưa được bật trên máy chủ. Vui lòng liên hệ chủ đầu tư.';

const s = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

/** Dòng `fn_portal_my_requests` → kiểu app; lịch sử mới nhất trước. */
export function toCustomerRequest(row: Record<string, unknown>): CustomerRequest {
  const logs = Array.isArray(row.lich_su) ? (row.lich_su as Record<string, unknown>[]) : [];
  return {
    id: s(row.id),
    code: s(row.so_phieu),
    title: s(row.tieu_de),
    content: s(row.noi_dung),
    category: s(row.loai) || null,
    status: s(row.trang_thai) || 'Mới tiếp nhận',
    statusColor: s(row.mau) || null,
    contract: s(row.hop_dong) || null,
    createdAt: s(row.created_at),
    updatedAt: s(row.updated_at) || null,
    attachments: Array.isArray(row.dinh_kem) ? (row.dinh_kem as unknown[]).map(s).filter(Boolean) : [],
    history: logs
      .map((l) => ({ content: s(l.noi_dung), status: s(l.trang_thai) || null, date: s(l.ngay) }))
      .sort((a, b) => b.date.localeCompare(a.date)),
  };
}

const COLOR_TONE: Record<string, Tone> = {
  green: 'success',
  lime: 'success',
  cyan: 'primary',
  blue: 'primary',
  geekblue: 'primary',
  purple: 'primary',
  orange: 'warning',
  gold: 'warning',
  yellow: 'warning',
  volcano: 'danger',
  red: 'danger',
  magenta: 'danger',
  gray: 'neutral',
  grey: 'neutral',
  default: 'neutral',
};

/** Màu trạng thái chủ đầu tư đặt trên web → tone nhãn app; không có màu thì đoán theo tên. */
export function requestStatusTone(status: string, color: string | null | undefined): Tone {
  const byColor = color ? COLOR_TONE[color.trim().toLowerCase()] : undefined;
  if (byColor) return byColor;
  const t = status.toLowerCase();
  if (/hoàn thành|đã xử lý|đã giải quyết|đóng/.test(t)) return 'success';
  if (/đang|chờ/.test(t)) return 'warning';
  if (/huỷ|hủy|từ chối/.test(t)) return 'neutral';
  return 'primary';
}

export interface RequestFormErrors {
  title?: string;
  content?: string;
  files?: string;
}

export function validateRequestForm(v: { title: string; content: string; files: number }): RequestFormErrors {
  const out: RequestFormErrors = {};
  const title = v.title.trim();
  if (title.length < 3) out.title = 'Vui lòng nhập tiêu đề (ít nhất 3 ký tự)';
  else if (title.length > REQUEST_TITLE_MAX) out.title = `Tiêu đề tối đa ${REQUEST_TITLE_MAX} ký tự`;
  if (v.content.trim().length > REQUEST_CONTENT_MAX) out.content = `Nội dung tối đa ${REQUEST_CONTENT_MAX} ký tự`;
  if (v.files > REQUEST_FILES_MAX) out.files = `Tối đa ${REQUEST_FILES_MAX} tệp đính kèm`;
  return out;
}

/** Hàm / edge chưa triển khai trên máy chủ → câu dễ hiểu; lỗi nghiệp vụ (tiếng Việt từ máy chủ) giữ nguyên. */
export function requestErrorMessage(message: string): string {
  return /could not find the function|schema cache|InvalidWorkerCreation|worker boot error|Function not found/i.test(message) ? REQUEST_NOT_ENABLED : message;
}

/**
 * Tên hợp đồng máy chủ ghép `concat_ws(' · ', số phiếu, mã căn, dự án)` → hàng 2 dòng dễ quét: mã căn đậm + "Dự án · Số phiếu".
 * Thiếu phần (concat_ws bỏ phần trống) thì không đoán: phần đầu làm tiêu đề, còn lại làm phụ đề.
 */
export function contractOptionParts(name: string): { title: string; subtitle: string } {
  const parts = name.split('·').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return { title: parts[1] as string, subtitle: [parts.slice(2).join(' · '), parts[0]].join(' · ') };
  return { title: parts[0] ?? 'Hợp đồng', subtitle: parts.slice(1).join(' · ') };
}

/** "brg/yeu-cau/kh/3f2a.jpg" → "3f2a.jpg". */
export function attachmentName(path: string): string {
  return path.split('/').pop() || path;
}

export function isImagePath(path: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(path);
}
