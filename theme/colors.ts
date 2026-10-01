import tokens from './tokens.json';

/**
 * Bảng màu BeeSky. Nguồn duy nhất là `tokens.json` (dùng chung với `tailwind.config.js`
 * và `tests/contrast.test.cjs`), nên className, style và test tương phản luôn đồng bộ.
 *
 * - `primary`: cam thương hiệu #F08A24 (500) — chỉ để trang trí, viền, thanh tiến độ, icon.
 * - `primary.700` (#A9520A, "cam mật ong đậm"): nền nút chính, chữ trắng 5.4:1.
 * - `gray`: thang "cát" ấm (hơi ngả nâu) — khác thang slate xanh xám.
 * - `ink`: nâu đen "cà phê" cho thẻ tổng tiền, chip đang chọn, toast — hợp với cam (ong: đen + mật).
 */
export const colors = tokens.colors;

export type ColorScale = typeof colors.primary;
export type Tone = keyof typeof tokens.tone;

/** Tra một tham chiếu "nhóm.bậc" (vd `gray.900`, `onInk.muted`) hoặc tên màu gốc (`white`). */
function resolveColor(ref: string): string {
  const value = ref.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], colors);
  if (typeof value !== 'string') throw new Error(`Token màu không tồn tại: ${ref}`);
  return value;
}

function resolveAll<T extends Record<string, string>>(refs: T): { [K in keyof T]: string } {
  return Object.fromEntries(Object.entries(refs).map(([key, ref]) => [key, resolveColor(ref)])) as { [K in keyof T]: string };
}

/**
 * Màu theo vai trò (khai báo ở `tokens.json` → `semantic`). Component dùng các token này thay vì chọn trực tiếp từ thang màu.
 * Mọi cặp chữ/nền được kiểm ≥ 4.5:1 bởi `npm test` (tests/contrast.test.cjs).
 * - Nút chính: nền `action` (primary-700) → hover `actionHover` → nhấn `actionPressed`, chữ `textOnAction` (trắng).
 * - Chữ cam: `textBrand` (primary-700). Chữ mờ: `textMuted` (gray-600). gray-400 chỉ cho icon trang trí.
 * - Nền cam sáng `brand` (#F08A24) chỉ đặt chữ `textOnBrand` (gray-900), không đặt chữ trắng.
 * - Nền tối `inverse` (ink-800): chữ `onInverse`, `onInverseMuted`, số tiền `onInverseAccent`.
 */
export const semantic = resolveAll(tokens.semantic);

/**
 * Cặp nền pastel / chữ đậm cho Badge, icon tròn... (chữ ≥ 4.5:1).
 * `onSolid`: màu icon/chữ đặt trên nền `solid` (≥ 3:1 cho icon).
 */
export const toneColors = Object.fromEntries(
  Object.entries(tokens.tone).map(([tone, refs]) => [tone, resolveAll(refs)]),
) as Record<Tone, { bg: string; fg: string; solid: string; border: string; onSolid: string }>;
