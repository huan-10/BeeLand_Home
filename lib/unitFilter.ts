/** Lọc theo mã căn — hàng chip "Tất cả · <mã căn>" ở Hợp đồng, Lịch thanh toán, Phiếu thu. */

const norm = (code: string) => code.trim();

/** Mã căn có trong dữ liệu: bỏ trùng / trống, sắp tự nhiên (A9 trước A10). */
export function unitCodesOf(items: { unitCode: string }[]): string[] {
  const set = new Set(items.map((i) => norm(i.unitCode)).filter(Boolean));
  return [...set].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
}

/** `unit = null` → tất cả. */
export function filterByUnit<T extends { unitCode: string }>(items: T[], unit: string | null): T[] {
  return unit === null ? items : items.filter((i) => norm(i.unitCode) === unit);
}

/** Căn đang chọn còn trong dữ liệu thì giữ, không thì về Tất cả (dữ liệu đổi sau khi làm mới / đổi công ty). */
export function activeUnit(units: string[], selected: string | null): string | null {
  return selected !== null && units.includes(selected) ? selected : null;
}
