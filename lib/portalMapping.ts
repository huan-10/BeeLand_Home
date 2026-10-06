import type { ContractStatus, ContractType, PaymentMethod } from '@/types';

/**
 * Ánh xạ dữ liệu database dùng chung (web `beeland` / `beeland-app_2026`) sang kiểu của app khách hàng.
 * Logic thuần, không gọi mạng — để test được.
 */

/** Giai đoạn phiếu (`cloud_pgc_phieu_giucho.giai_doan`) → loại hợp đồng của app. */
export function contractTypeFromStage(giaiDoan: string | null | undefined): ContractType {
  const g = String(giaiDoan ?? '').toUpperCase();
  if (g === 'HDMB' || g === 'HDGV' || g === 'THANHLY') return 'purchase';
  if (g === 'DATCOC') return 'deposit';
  return 'reservation';
}

/**
 * Trạng thái phiếu (`cloud_catalogs` loại `pgc_trang_thai`, `item_code`) → 4 nhóm trạng thái của app.
 * Tên gốc trên server vẫn hiển thị ở badge (`Contract.statusLabel`).
 */
export function contractStatusFromCode(code: string | null | undefined): ContractStatus {
  const c = String(code ?? '').replace(/\D/g, '');
  // 11 Đã thanh lý · 16 Hủy booking
  if (c === '11' || c === '16') return 'cancelled';
  // 19 Đã cấp sổ đỏ · 21 Thanh lý tất toán đã duyệt
  if (c === '19' || c === '21') return 'completed';
  // 6 Đã duyệt · 13 Đặt cọc đã duyệt · 14 HĐMB đã duyệt · 15 Góp vốn đã duyệt · 17 Bàn giao chờ duyệt · 18 Đã duyệt BG · 22 Kế toán duyệt
  if (['6', '13', '14', '15', '17', '18', '22'].includes(c)) return 'active';
  // 1, 7, 8, 9, 10, 12, 20 (các bước chờ duyệt) hoặc chưa có trạng thái
  return 'pending';
}

/**
 * "A1-1107" → toà "A1", tầng 11; "A1-12A01" (tầng 12A) → toà "A1", tầng 12.
 * `soTang` (bds_products.so_tang) ưu tiên nếu là số.
 */
export function parseUnitCode(kyHieu: string, soTang?: unknown): { block: string; floor: number } {
  const m = /^([A-Za-z0-9]+)[-.](\d{1,2})[A-Za-z]?(\d{2})$/.exec(kyHieu.trim());
  const fromTang = Number(String(soTang ?? '').replace(/\D/g, ''));
  const floor = Number.isFinite(fromTang) && fromTang > 0 ? fromTang : m ? Number(m[2]) : 0;
  return { block: m ? m[1] : '', floor };
}

/** Phần ngày (yyyy-MM-dd) của chuỗi thời gian server (đã theo giờ VN, vd "2026-10-04T00:00:00+07:00"). */
export function dateOnly(value: unknown): string {
  const s = String(value ?? '');
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
}

/** Hình thức thu ("Chuyển khoản", "Tiền mặt", "Thẻ/POS"…) → phương thức của app. */
export function paymentMethodFromText(text: unknown): PaymentMethod {
  const t = String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  if (t.includes('chuyen') || t.includes('ck') || t.includes('ngan hang')) return 'bank_transfer';
  if (t.includes('the') || t.includes('pos')) return 'card';
  return 'cash';
}

/** Số tiền từ server (có thể lẻ phần thập phân do làm tròn tỷ lệ) → đồng nguyên. */
export function money(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}
