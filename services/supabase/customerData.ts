import { inList, restGet, rpc, str } from './client';
import { withServiceJwt } from './portal';
import { onSessionChange, requireCustomerScope, type CustomerScope } from '../session';
import { ServiceError } from '../errors';

/**
 * Dữ liệu giao dịch của KHÁCH ĐANG ĐĂNG NHẬP trên database dùng chung — y như app 2026
 * (`CustomerService.getCustomerTransactions`, `PaymentProgressService`) và web (`ContractScheduleService`,
 * `PgcCashVouchersTab`):
 *  - Giao dịch: `cloud_pgc_phieu_giucho` lọc **khach_hang_id = khách hiện tại** và **ma_ctdk_uid = công ty của tài khoản**.
 *  - Lịch thanh toán: RPC `fn_contract_payment_schedule(p_ma_ctdk_uid, p_pgc_id)`; rỗng → lịch lưu trên phiếu.
 *  - Phiếu thu: RPC `fn_cash_vouchers_by_pgc(…, 'THU')`, tiền = `so_tien_pgc` (phần thuộc phiếu).
 * Bảo vệ: chỉ gọi lịch / phiếu thu cho phiếu đã nằm trong danh sách của khách (`requireOwnedPgc`).
 */

export interface PgcRow {
  id: string;
  so_phieu_gc: string | null;
  giai_doan: string | null;
  gia_tri_hd: number | null;
  gia_tri_hd_sau_ck: number | null;
  tien_coc: number | null;
  da_thu: number | null;
  dien_tich: number | null;
  san_pham_id: string | null;
  project_id: string | null;
  trang_thai_id: string | null;
  khach_hang_id: string | null;
  ma_ctdk_uid: string | null;
  ngay_giu_cho: string | null;
  created_at: string | null;
  tt_hop_dong: Record<string, unknown> | null;
  lich_thanh_toan: Record<string, unknown>[] | null;
}

export interface ProductRow {
  id: string;
  ky_hieu: string | null;
  ma_sp: string | null;
  so_tang: string | number | null;
  dien_tich_thong_thuy: number | null;
  dien_tich: number | null;
}

export interface ProjectRow {
  id: string;
  ten_da: string | null;
  dia_chi: string | null;
  ma_da_code: string | null;
  image_url: string | null;
  /** Ảnh đại diện đã chuẩn hoá thành URL tuyệt đối (rỗng nếu dự án chưa có ảnh). */
  imageUrl?: string;
}

/** Máy chủ file upload của web (đường dẫn tương đối `upload/...`) — như `beeland-app_2026/sevicesSupabase/ProjectService.ts`. */
const FILE_SERVER = 'https://upload.beesky.vn/';

export function absFileUrl(path: unknown): string {
  const s = str(path).trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : FILE_SERVER + s.replace(/^\/+/, '');
}

/**
 * Ảnh dự án như app 2026: `cloud_catalogs` loại `du_an_anh` (item_code = ma_da_code, theo công ty) →
 * `anh_background` → `anh_icon`; không có thì `da_projects.image_url`.
 */
async function attachProjectImages(jwt: string, companyId: string, projects: Record<string, ProjectRow>): Promise<void> {
  const list = Object.values(projects);
  const codes = uniq(list.map((p) => (p.ma_da_code == null ? null : String(p.ma_da_code))));
  let byCode: Record<string, Record<string, unknown>> = {};
  if (codes.length) {
    try {
      const rows = await restGet<{ item_code: string | null; raw: Record<string, unknown> | null }[]>(
        `cloud_catalogs?select=item_code,raw&catalog_type=eq.du_an_anh&ma_ctdk_uid=eq.${encodeURIComponent(companyId)}` +
          `&item_code=in.${encodeURIComponent(inList(codes))}`,
        jwt,
      );
      byCode = Object.fromEntries((rows ?? []).filter((r) => r.item_code != null).map((r) => [String(r.item_code), r.raw ?? {}]));
    } catch {
      // Không đọc được ảnh → dùng ảnh dự phòng của giao diện.
    }
  }
  for (const p of list) {
    const anh = byCode[String(p.ma_da_code ?? '')] ?? {};
    p.imageUrl = absFileUrl(anh.anh_background) || absFileUrl(anh.anh_icon) || absFileUrl(p.image_url);
  }
}

export interface StatusRow {
  id: string;
  item_code: string | null;
  item_name: string | null;
}

/** Một giao dịch của khách kèm thông tin tra cứu. */
export interface PgcRecord {
  row: PgcRow;
  product: ProductRow | null;
  project: ProjectRow | null;
  status: StatusRow | null;
}

/** Dòng `fn_contract_payment_schedule`. */
export interface ScheduleRpcRow {
  dot_tt: number;
  dot_tt_text: string | null;
  ngay_tt: string | null;
  ty_le_tt: number | null;
  phai_thu: number | null;
  da_thu: number | null;
  phai_thu_pbt: number | null;
  da_thu_pbt: number | null;
  dien_giai: string | null;
}

/** Dòng `fn_cash_vouchers_by_pgc`. */
export interface VoucherRow {
  id: string;
  so_phieu: string | null;
  ngay_phieu: string | null;
  nguoi_nop: string | null;
  dien_giai: string | null;
  hinh_thuc: string | null;
  so_tien: number | null;
  so_tien_pgc: number | null;
  ky_hieu: string | null;
}

const PGC_COLUMNS =
  'id,so_phieu_gc,giai_doan,gia_tri_hd,gia_tri_hd_sau_ck,tien_coc,da_thu,dien_tich,san_pham_id,project_id,trang_thai_id,khach_hang_id,ma_ctdk_uid,ngay_giu_cho,created_at,tt_hop_dong,lich_thanh_toan';

/** Bộ nhớ đệm ngắn: Trang chủ / Hợp đồng / Thanh toán gọi cùng lúc nhiều service trên cùng dữ liệu. */
const TTL_MS = 20_000;
type Entry<T> = { at: number; value: Promise<T> };
let recordsCache: (Entry<PgcRecord[]> & { key: string }) | null = null;
const scheduleCache = new Map<string, Entry<ScheduleRpcRow[]>>();
const voucherCache = new Map<string, Entry<VoucherRow[]>>();

/** Đổi / thoát phiên → xoá sạch dữ liệu đệm của khách trước. */
export function clearCustomerDataCache(): void {
  recordsCache = null;
  scheduleCache.clear();
  voucherCache.clear();
}
onSessionChange(clearCustomerDataCache);

function cached<T>(map: Map<string, Entry<T>>, key: string, load: () => Promise<T>, force: boolean): Promise<T> {
  const hit = map.get(key);
  if (!force && hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = load();
  map.set(key, { at: Date.now(), value });
  value.catch(() => map.delete(key));
  return value;
}

const scopeKey = (s: CustomerScope) => `${s.companyId}:${s.customerId}`;

async function lookup<T extends { id: string }>(jwt: string, table: string, select: string, ids: string[]): Promise<Record<string, T>> {
  if (ids.length === 0) return {};
  try {
    const rows = await restGet<T[]>(`${table}?select=${select}&id=in.${encodeURIComponent(inList(ids))}`, jwt);
    return Object.fromEntries((rows ?? []).map((r) => [r.id, r]));
  } catch {
    // Thiếu tên dự án / căn không chặn cả danh sách (như app 2026).
    return {};
  }
}

const uniq = (values: (string | null)[]) => [...new Set(values.filter((v): v is string => !!v))];

async function loadRecords(scope: CustomerScope): Promise<PgcRecord[]> {
  return withServiceJwt(async (jwt) => {
    const rows = await restGet<PgcRow[]>(
      `cloud_pgc_phieu_giucho?select=${PGC_COLUMNS}` +
        `&khach_hang_id=eq.${encodeURIComponent(scope.customerId)}` +
        `&ma_ctdk_uid=eq.${encodeURIComponent(scope.companyId)}` +
        `&deleted_at=is.null&order=created_at.desc&limit=200`,
      jwt,
    );
    // Lọc lại phía app: tuyệt đối không giữ dòng của khách / công ty khác.
    const own = (rows ?? []).filter((r) => r.khach_hang_id === scope.customerId && r.ma_ctdk_uid === scope.companyId);
    const [products, projects, statuses] = await Promise.all([
      lookup<ProductRow>(jwt, 'bds_products', 'id,ky_hieu,ma_sp,so_tang,dien_tich_thong_thuy,dien_tich', uniq(own.map((r) => r.san_pham_id))),
      lookup<ProjectRow>(jwt, 'da_projects', 'id,ten_da,dia_chi,ma_da_code,image_url', uniq(own.map((r) => r.project_id))),
      lookup<StatusRow>(jwt, 'cloud_catalogs', 'id,item_code,item_name', uniq(own.map((r) => r.trang_thai_id))),
    ]);
    await attachProjectImages(jwt, scope.companyId, projects);
    return own.map((row) => ({
      row,
      product: (row.san_pham_id && products[row.san_pham_id]) || null,
      project: (row.project_id && projects[row.project_id]) || null,
      status: (row.trang_thai_id && statuses[row.trang_thai_id]) || null,
    }));
  });
}

/** Mọi giao dịch (giữ chỗ / đặt cọc / hợp đồng) của khách đang đăng nhập. */
export function getCustomerRecords(force = false): Promise<PgcRecord[]> {
  const scope = requireCustomerScope();
  const key = scopeKey(scope);
  if (!force && recordsCache && recordsCache.key === key && Date.now() - recordsCache.at < TTL_MS) return recordsCache.value;
  const value = loadRecords(scope);
  recordsCache = { key, at: Date.now(), value };
  value.catch(() => {
    if (recordsCache?.value === value) recordsCache = null;
  });
  return value;
}

/** Phiếu phải thuộc khách hiện tại — chặn mọi truy cập bằng id của khách khác. */
export async function requireOwnedPgc(pgcId: string): Promise<PgcRecord> {
  const record = (await getCustomerRecords()).find((r) => r.row.id === pgcId);
  if (!record) throw new ServiceError('Không tìm thấy hợp đồng.', 'NOT_FOUND');
  return record;
}

/** Lịch thanh toán từng đợt (đã có Đã thu / Còn lại) của một phiếu thuộc khách. */
export async function getPgcSchedule(pgcId: string, force = false): Promise<ScheduleRpcRow[]> {
  const { row } = await requireOwnedPgc(pgcId);
  const scope = requireCustomerScope();
  return cached(
    scheduleCache,
    pgcId,
    () =>
      withServiceJwt(async (jwt) => {
        const rows = await rpc<ScheduleRpcRow[]>('fn_contract_payment_schedule', { p_ma_ctdk_uid: scope.companyId, p_pgc_id: row.id }, jwt).catch(
          () => [] as ScheduleRpcRow[],
        );
        return Array.isArray(rows) ? rows : [];
      }),
    force,
  );
}

/** Phiếu thu của một phiếu thuộc khách (tiền = phần thuộc phiếu này). */
export async function getPgcVouchers(pgcId: string, force = false): Promise<VoucherRow[]> {
  const { row } = await requireOwnedPgc(pgcId);
  const scope = requireCustomerScope();
  return cached(
    voucherCache,
    pgcId,
    () =>
      withServiceJwt(async (jwt) => {
        const rows = await rpc<VoucherRow[]>('fn_cash_vouchers_by_pgc', { p_ma_ctdk_uid: scope.companyId, p_pgc_id: row.id, p_loai: 'THU' }, jwt);
        return Array.isArray(rows) ? rows : [];
      }),
    force,
  );
}

/** Thông tin công ty (bên bán) của tài khoản đang đăng nhập. */
export async function getSellerCompany(): Promise<{ ten_ct: string; dia_chi: string; dien_thoai: string; email: string } | null> {
  const scope = requireCustomerScope();
  try {
    return await withServiceJwt(async (jwt) => {
      const rows = await restGet<Record<string, unknown>[]>(
        `cloud_companies?select=ten_ct,dia_chi,dien_thoai,email&id=eq.${encodeURIComponent(scope.companyId)}&limit=1`,
        jwt,
      );
      const r = rows?.[0];
      return r ? { ten_ct: str(r.ten_ct), dia_chi: str(r.dia_chi), dien_thoai: str(r.dien_thoai), email: str(r.email) } : null;
    });
  } catch {
    return null;
  }
}
