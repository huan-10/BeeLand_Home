import { rpc, str } from './client';
import { chooseProfile } from './portal';
import { onSessionChange, requireCustomerScope, requirePortalToken, type CustomerScope } from '../session';
import { ServiceError } from '../errors';

/**
 * Đọc THEO PHIÊN KHÁCH (2026-10-08, giai đoạn 2 bỏ tài khoản hệ thống): `fn_portal_app_hop_dong` / `fn_portal_app_lich_tt` /
 * `fn_portal_app_phieu_thu` / `fn_portal_app_cong_ty` (`beeland/supabase/migrations/20261009200000_portal_app_du_lieu.sql`) bằng
 * token phiên — server chỉ trả dữ liệu của hồ sơ đang xem; không đọc bảng bằng JWT tài khoản hệ thống nữa.
 *
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

export interface StatusRow {
  id: string;
  item_code: string | null;
  item_name: string | null;
}

/** Booking mới nhất của phiếu giữ chỗ (`cloud_bookings`, bỏ dòng LOCK) — số tiền + hạn giữ chỗ để thanh toán QR. */
export interface BookingRow {
  ma_pgc_id: string | null;
  tien_giu_cho: number | null;
  het_han_luc: string | null;
  loai_ct: string | null;
  created_at: string | null;
}

/** Một giao dịch của khách kèm thông tin tra cứu. */
export interface PgcRecord {
  row: PgcRow;
  product: ProductRow | null;
  project: ProjectRow | null;
  status: StatusRow | null;
  /** Chỉ phiếu giữ chỗ đang chờ duyệt (mã 1). */
  booking?: BookingRow | null;
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

type Envelope<T> = { data?: T; error?: string } | null;

/** Kết quả `fn_portal_app_*`: lỗi `{ error }` → ServiceError (phiên hết hạn → UNAUTHORIZED). */
function unwrap<T>(res: Envelope<T>, fallback: T): T {
  if (res && typeof res === 'object' && typeof res.error === 'string' && res.error) {
    throw new ServiceError(res.error, /hết hạn/i.test(res.error) ? 'UNAUTHORIZED' : 'NOT_FOUND');
  }
  return res?.data ?? fallback;
}

/** Một dòng `fn_portal_app_hop_dong`. */
interface RecordRpcRow {
  pgc: PgcRow;
  product: ProductRow | null;
  project: (ProjectRow & { anh_background?: string | null; anh_icon?: string | null }) | null;
  status: StatusRow | null;
  booking: BookingRow | null;
}

async function loadRecords(scope: CustomerScope): Promise<PgcRecord[]> {
  const token = requirePortalToken();
  const fetchOnce = () => rpc<Envelope<RecordRpcRow[]> & { khach_hang_id?: string }>('fn_portal_app_hop_dong', { p_token: token });
  let res = await fetchOnce();
  // Server đang dùng hồ sơ khác hồ sơ của app (đổi hồ sơ dở dang / nhân viên đổi hồ sơ gốc) → đặt lại cho phiên rồi tải lại,
  // để yêu cầu / thanh toán online (đọc hồ sơ trên server) cùng hồ sơ với màn hình.
  if (res?.khach_hang_id && res.khach_hang_id !== scope.customerId) {
    await chooseProfile(token, scope.customerId).catch(() => undefined);
    res = await fetchOnce();
  }
  const rows = unwrap(res, []);
  return (Array.isArray(rows) ? rows : [])
    // Lọc lại phía app: tuyệt đối không giữ dòng của khách / công ty khác.
    .filter((r) => r?.pgc && r.pgc.khach_hang_id === scope.customerId && r.pgc.ma_ctdk_uid === scope.companyId)
    .map(({ pgc, product, project, status, booking }) => ({
      row: pgc,
      product: product ?? null,
      // Ảnh dự án như app 2026: cloud_catalogs du_an_anh → anh_background → anh_icon; không có thì da_projects.image_url.
      project: project ? { ...project, imageUrl: absFileUrl(project.anh_background) || absFileUrl(project.anh_icon) || absFileUrl(project.image_url) } : null,
      status: status ?? null,
      booking: booking ?? null,
    }));
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
  // Lấy token CÙNG lúc với hồ sơ (đổi hồ sơ giữa chừng → không gọi phiếu cũ bằng token mới rồi lưu đệm lịch rỗng).
  const token = requirePortalToken();
  const { row } = await requireOwnedPgc(pgcId);
  return cached(
    scheduleCache,
    pgcId,
    async () => {
      // Phiên hết hạn → báo đăng nhập lại; lỗi khác → rỗng (màn dùng lịch lưu trên phiếu).
      const rows = await rpc<Envelope<ScheduleRpcRow[]>>('fn_portal_app_lich_tt', { p_token: token, p_pgc_id: row.id })
        .then((r) => unwrap(r, []))
        .catch((e: unknown) => {
          if (e instanceof ServiceError && (e.code === 'UNAUTHORIZED' || e.code === 'NETWORK')) throw e;
          return [] as ScheduleRpcRow[];
        });
      return Array.isArray(rows) ? rows : [];
    },
    force,
  );
}

/** Phiếu thu của một phiếu thuộc khách (tiền = phần thuộc phiếu này). */
export async function getPgcVouchers(pgcId: string, force = false): Promise<VoucherRow[]> {
  const token = requirePortalToken();
  const { row } = await requireOwnedPgc(pgcId);
  return cached(
    voucherCache,
    pgcId,
    async () => {
      const rows = unwrap(await rpc<Envelope<VoucherRow[]>>('fn_portal_app_phieu_thu', { p_token: token, p_pgc_id: row.id }), []);
      return Array.isArray(rows) ? rows : [];
    },
    force,
  );
}

/** Thông tin công ty (bên bán) của tài khoản đang đăng nhập. */
export async function getSellerCompany(): Promise<{ ten_ct: string; dia_chi: string; dien_thoai: string; email: string } | null> {
  requireCustomerScope();
  try {
    const r = unwrap(await rpc<Envelope<Record<string, unknown> | null>>('fn_portal_app_cong_ty', { p_token: requirePortalToken() }), null);
    return r ? { ten_ct: str(r.ten_ct), dia_chi: str(r.dia_chi), dien_thoai: str(r.dien_thoai), email: str(r.email) } : null;
  } catch {
    return null;
  }
}
