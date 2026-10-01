/**
 * Test tương phản WCAG 2.1 cho bảng màu BeeSky (chạy: `npm test`).
 * Đọc trực tiếp `theme/tokens.json` — cùng nguồn với theme/colors.ts — nên đổi token là test chạy lại ngay.
 * Chữ thường ≥ 4.5:1 (AA). Icon, viền focus, thanh tiến độ, thành phần đồ họa ≥ 3:1 (1.4.11).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const tokens = require('../theme/tokens.json');

const resolve = (ref) => {
  const value = ref.split('.').reduce((node, key) => (node == null ? undefined : node[key]), tokens.colors);
  if (typeof value !== 'string') throw new Error(`Token màu không tồn tại: ${ref}`);
  return value;
};
const semantic = Object.fromEntries(Object.entries(tokens.semantic).map(([k, ref]) => [k, resolve(ref)]));
const tone = Object.fromEntries(
  Object.entries(tokens.tone).map(([t, refs]) => [t, Object.fromEntries(Object.entries(refs).map(([k, ref]) => [k, resolve(ref)]))]),
);

const parse = (color) => {
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1);
  const rgba = color.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const [r, g, b, a = 1] = rgba[1].split(',').map(Number);
    return [r, g, b, a];
  }
  throw new Error(`Không đọc được màu: ${color}`);
};
/** Phủ màu bán trong suốt lên nền đặc. */
const over = (top, bottom) => {
  const [r, g, b, a] = parse(top);
  const base = parse(bottom);
  return `rgb(${[r, g, b].map((v, i) => Math.round(v * a + base[i] * (1 - a))).join(', ')})`;
};
const luminance = (color) => {
  const [r, g, b] = parse(color).slice(0, 3).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const check = (name, fg, bg, min) =>
  test(`${name}: ${fg} trên ${bg} ≥ ${min}:1`, () => {
    const r = ratio(fg, bg);
    assert.ok(r >= min, `${name} chỉ đạt ${r.toFixed(2)}:1`);
  });

const TEXT = 4.5;
const GRAPHIC = 3;
const s = semantic;
const glassOnWhite = over(s.glass, tokens.colors.white);
const glassOnInk = over(s.glass, tokens.colors.ink['900']);

// Chữ thường trên các nền sáng
for (const [bgName, bg] of [['surface', s.surface], ['bg', s.bg], ['surfaceMuted', s.surfaceMuted], ['surfaceSunken', s.surfaceSunken]]) {
  for (const fg of ['text', 'textSecondary', 'textMuted', 'textBrand', 'textSuccess']) check(`${fg} / ${bgName}`, s[fg], bg, TEXT);
}
check('placeholder / surface', s.placeholder, s.surface, TEXT);
// Ô nhập kiểu mềm: nền cát nhạt khi chưa focus
check('placeholder / surfaceSunken (ô nhập)', s.placeholder, s.surfaceSunken, TEXT);
check('icon ô nhập / surfaceSunken', s.textMuted, s.surfaceSunken, GRAPHIC);
check('viền ô nhập focus / surface', s.focusRing, s.surface, GRAPHIC);

// Nút chính: chữ trắng trên cam đậm ở mọi trạng thái
for (const state of ['action', 'actionHover', 'actionPressed']) check(`textOnAction / ${state}`, s.textOnAction, s[state], TEXT);
// Nền cam thương hiệu sáng chỉ đặt chữ tối
check('textOnBrand / brand', s.textOnBrand, s.brand, TEXT);
check('textOnBrand / brandPressed', s.textOnBrand, s.brandPressed, TEXT);

// Nền tối ink (thẻ tổng tiền, chip đang chọn, thanh tab đang chọn, toast)
for (const bg of ['inverse', 'inverseHover', 'inverseStrong']) {
  check(`onInverse / ${bg}`, s.onInverse, s[bg], TEXT);
  check(`onInverseMuted / ${bg}`, s.onInverseMuted, s[bg], TEXT);
  check(`onInverseAccent / ${bg}`, s.onInverseAccent, s[bg], TEXT);
}
check('thanh tiến độ cam / inverse', s.brand, s.inverse, GRAPHIC);
check('thanh tiến độ xanh / inverse', tone.success.solid, s.inverse, GRAPHIC);
check('thanh tiến độ cam / track trên inverse', s.brand, over(s.inverseTrack, s.inverse), GRAPHIC);

// Badge / icon tròn / thông báo: chữ đậm trên nền pastel và trên thẻ trắng
for (const [name, t] of Object.entries(tone)) {
  check(`tone.${name}.fg / tone.bg`, t.fg, t.bg, TEXT);
  check(`tone.${name}.fg / surface`, t.fg, s.surface, TEXT);
  check(`tone.${name}.onSolid / solid (icon)`, t.onSolid, t.solid, GRAPHIC);
}

// Thanh tab kính mờ (mobile): chữ trên lớp kính, xét cả khi nội dung phía sau trắng hoặc tối nhất
for (const [bgName, bg] of [['kính/nền trắng', glassOnWhite], ['kính/nền tối', glassOnInk]]) {
  check(`textSecondary / ${bgName}`, s.textSecondary, bg, TEXT);
  check(`textMuted / ${bgName}`, s.textMuted, bg, TEXT);
}

// Thành phần đồ họa
check('focusRing / surface', s.focusRing, s.surface, GRAPHIC);
check('focusRing / bg', s.focusRing, s.bg, GRAPHIC);
check('focusRing / inverse', s.onInverse, s.inverse, GRAPHIC);
check('icon / surface', s.icon, s.surface, GRAPHIC);
check('nút danger: chữ / surface', tone.danger.fg, s.surface, TEXT);
check('nút danger: chữ / nền hover', tone.danger.fg, tone.danger.bg, TEXT);

// Lớp phủ ảnh: chữ trắng trên ảnh (xét vùng sáng nhất của ảnh khu đô thị)
const brightPhoto = 'rgb(253, 214, 170)';
for (const name of ['heroScrim', 'brandTint', 'brandTintStrong']) {
  check(`chữ trắng / ${name} trên vùng ảnh sáng`, tokens.colors.white, over(tokens.colors.overlay[name], brightPhoto), TEXT);
}
