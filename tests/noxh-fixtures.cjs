// Dữ liệu mẫu + nạp module TS cho test NOXH (không phải file test — không khớp *.test.cjs).
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(rel) {
  const src = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', src)(mod, mod.exports, require);
  return mod.exports;
}
const addr = (o = {}) => ({ dia_chi: '12 Lê Lợi', ma_tinh: '01', ten_tinh: 'Hà Nội', ma_xa: '001', ten_xa: 'Phúc Xá', ...o });
const snapshot = (o = {}) => ({
  ma_so_kh: 'KH-1',
  ten_kh: 'Nguyễn Văn An',
  ngay_sinh: '1990-01-01',
  gioi_tinh: 'Nam',
  cccd: '079090001234',
  ngay_cap: null,
  noi_cap: '',
  di_dong: '0901234567',
  email: '',
  anh_url: '',
  thuong_tru: addr(),
  hien_tai_giong_thuong_tru: true,
  hien_tai: addr(),
  ...o,
});
let docSeq = 0;
const doc = (o = {}) => ({
  id: `d${++docSeq}`,
  ten: 'Bản sao CCCD',
  bat_buoc: true,
  dinh_dang: ['pdf', 'jpg', 'png'],
  dung_luong_mb: 5,
  co_mau: false,
  tep_ten: null,
  tep_kich_thuoc: null,
  ngay_nop: null,
  trang_thai: 'CHUA_CUNG_CAP',
  ly_do: null,
  han_nop: null,
  ...o,
});
const submitted = (o = {}) => doc({ tep_ten: 'cccd.pdf', tep_kich_thuoc: 1000, ngay_nop: '2026-10-01', trang_thai: 'CHO_THAM_DINH', ...o });
const detail = (o = {}) => ({
  id: 'hs1',
  company_id: 'c1',
  so_ho_so: 'NOXH-2026-000001',
  trang_thai: 'NHAP',
  nguon: 'PORTAL',
  da_project_id: 'p1',
  ten_du_an: 'Dự án A',
  dot_id: 'dot1',
  dot: null,
  nhom_doi_tuong_id: 'g1',
  ten_nhom: 'Công nhân',
  loai_can_id: 'lc1',
  ten_loai_can: '2 phòng ngủ',
  ngay_tiep_nhan: '2026-10-01',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  kh_snapshot: snapshot(),
  giay_to: [submitted(), submitted({ ten: 'Đơn đăng ký' })],
  lich_su: [],
  quyen: { sua_thong_tin: true, sua_giay_to: [], nop: true, gui_bo_sung: false, xoa: true },
  boc_tham: null,
  ...o,
});
const row = (o = {}) => ({
  id: 'r1',
  company_id: 'c1',
  so_ho_so: 'NOXH-2026-000001',
  trang_thai: 'DANG_THAM_DINH',
  ten_du_an: 'Dự án A',
  ten_dot: 'Đợt 1',
  ten_nhom: 'Công nhân',
  ngay_tiep_nhan: '2026-10-01',
  updated_at: '2026-10-01T00:00:00Z',
  so_giay_to: 8,
  so_da_nop: 8,
  so_dat: 0,
  so_can_bo_sung: 0,
  ...o,
});
/**
 * Nạp module TS kèm các import nội bộ (`@/…`, `./…`) — dùng cho service mock. Module ngoài (react-native…) không được hỗ trợ.
 */
const ROOT = path.join(__dirname, '..');
const cache = new Map();
function resolveTs(spec, fromDir) {
  const base = spec.startsWith('@/') ? path.join(ROOT, spec.slice(2)) : path.resolve(fromDir, spec);
  for (const c of [base + '.ts', base + '.tsx', path.join(base, 'index.ts'), base]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  throw new Error(`Không tìm thấy module ${spec} (từ ${fromDir})`);
}
function loadDeep(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const mod = { exports: {} };
  cache.set(file, mod);
  const req = (spec) => (spec.startsWith('@/') || spec.startsWith('.') ? loadDeep(resolveTs(spec, path.dirname(file))) : require(spec));
  new Function('module', 'exports', 'require', out)(mod, mod.exports, req);
  return mod.exports;
}
/** Thay một module nội bộ bằng bản giả (trước lần nạp đầu) — test nhánh API không gọi server. */
const stubModule = (rel, exports) => cache.set(resolveTs(rel.startsWith('@/') ? rel : '@/' + rel.replace(/\.tsx?$/, ''), ROOT), { exports });
const loadModule = (rel) => loadDeep(resolveTs(rel.startsWith('@/') ? rel : '@/' + rel.replace(/\.tsx?$/, ''), ROOT));

module.exports = { load, loadModule, stubModule, doc, submitted, detail, row, snapshot, addr };
