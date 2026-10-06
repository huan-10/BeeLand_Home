/**
 * Nhà ở xã hội — nối dữ liệu thật, cùng luồng với web (`beeland/src/services/PortalNoxhService.ts`).
 *
 * - Đọc theo slug website `mau4` (không cần token): `fn_portal_noxh_dot_list/dot_get/loai_can/boc_tham_cong_bo`.
 * - Theo token phiên NOXH của từng công ty: hồ sơ, giấy tờ, bốc thăm, thông báo.
 * - Tệp: edge function `portal-noxh` (`upload-url` / `download-url`) + bucket riêng tư `drive-files` + `fn_portal_noxh_file_attach`.
 * - Mỗi lời gọi dùng token của ĐÚNG công ty sở hữu hồ sơ / đợt / lượt (nhớ tạm khi tải danh sách).
 * - Phong bì `{ data } | { error }`; `PHIEN_HET_HAN` → bỏ token NOXH của công ty đó (không đăng xuất cả app).
 *
 * ⚠ Các hàm ghi (lưu/nộp/xoá hồ sơ, gửi bổ sung, gắn tệp, quay, đánh dấu đã đọc) ghi vào database thật khi khách thao tác
 * (người dùng đồng ý 2026-10-05, `docs/database.md`). Khi phát triển không tự gọi các hàm này.
 */
import { isNoxhSessionExpired, normalizeCccd, validateNoxhFile } from '@/lib/noxh';
import type {
  NoxhAccountInfo,
  NoxhApplicationDetail,
  NoxhApplicationRow,
  NoxhDoc,
  NoxhLoaiCan,
  NoxhLotteryItem,
  NoxhLotteryMine,
  NoxhNotification,
  NoxhPublishedLottery,
  NoxhPublishedRow,
  NoxhRound,
  NoxhRoundDetail,
  NoxhSavePayload,
  NoxhSaveResult,
  NoxhSpinResult,
} from '@/types';

import { ServiceError } from './errors';
import { NoxhConflictError } from './noxhErrors';
import { emitNoxhSessionExpired, getNoxhLinks, getSessionCompanies, type CompanyNoxhLink } from './session';
import { edge, rpc } from './supabase/client';
import { getNoxhSites } from './supabase/portal';
import { publicStorageUrl, uploadToSignedUrl, type UploadableFile } from './supabase/storage';

const BUCKET = 'drive-files';
const NEED_CONNECT = 'Vui lòng kết nối tài khoản Nhà ở xã hội để tiếp tục.';
const statusRank: Record<string, number> = { DANG_MO: 0, SAP_MO: 1, DA_DONG: 2, CHUA_CONG_BO: 3 };

type Envelope<T> = { data?: T; error?: string };

/* ---------------- Gọi máy chủ ---------------- */

function unwrap<T>(res: Envelope<T> | null, companyId?: string): T {
  if (isNoxhSessionExpired(res)) {
    if (companyId) emitNoxhSessionExpired(companyId);
    throw new ServiceError('Phiên Nhà ở xã hội đã hết hạn, vui lòng kết nối lại.', 'UNAUTHORIZED');
  }
  if (res?.error) throw new ServiceError(res.error);
  return res?.data as T;
}

async function call<T>(fn: string, args: Record<string, unknown>, companyId?: string): Promise<T> {
  return unwrap(await rpc<Envelope<T>>(fn, args), companyId);
}

async function edgeCall<T>(body: Record<string, unknown>, companyId: string): Promise<T> {
  return unwrap(await edge<Envelope<T>>('portal-noxh', body), companyId);
}

/** Gọi ở mọi phần tử, gộp kết quả thành công; chỉ ném lỗi khi TẤT CẢ đều lỗi (một công ty lỗi không làm trống danh sách). */
async function settleAll<S, T>(items: S[], run: (item: S) => Promise<T[]>): Promise<T[]> {
  const results = await Promise.allSettled(items.map(run));
  const ok = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failed && results.every((r) => r.status === 'rejected')) throw failed.reason;
  return ok;
}

/* ---------------- Nhớ tạm: thứ gì thuộc công ty nào ---------------- */

const roundSite = new Map<string, { companyId: string; slug: string }>();
const hoSoCompany = new Map<string, string>();
const lotteryCompany = new Map<string, string>();
const notificationCompany = new Map<string, string>();
const publishedSite = new Map<string, { companyId: string; slug: string; projectId: string }>();

function linkOf(companyId: string | undefined): CompanyNoxhLink {
  const link = getNoxhLinks().find((l) => l.companyId === companyId);
  if (!link) throw new ServiceError(NEED_CONNECT, 'UNAUTHORIZED');
  return link;
}

/** Slug website NOXH của mọi công ty khách có tài khoản (phiên đã biết → dùng luôn; còn thiếu → đọc `cloud_customer_web_configs`). */
async function companySites(): Promise<{ companyId: string; companyName: string; slug: string }[]> {
  const companies = getSessionCompanies();
  const missing = companies.filter((c) => !c.noxhSite).map((c) => c.companyId);
  const read = missing.length ? (await getNoxhSites(missing)).byCompany : {};
  return companies.flatMap((c) => {
    const slug = c.noxhSite ?? read[c.companyId];
    return slug ? [{ companyId: c.companyId, companyName: c.companyName, slug }] : [];
  });
}

async function siteOfRound(dotId: string): Promise<{ companyId: string; slug: string }> {
  if (!roundSite.has(dotId)) await getRounds();
  const site = roundSite.get(dotId);
  if (!site) throw new ServiceError('Không tìm thấy đợt nhận hồ sơ', 'NOT_FOUND');
  return site;
}

/** Công ty sở hữu hồ sơ; chưa biết → hỏi lần lượt từng công ty đã kết nối. */
async function companyOfApplication(id: string): Promise<string> {
  if (!hoSoCompany.has(id)) await getApplication(id);
  return hoSoCompany.get(id) ?? '';
}

/* ---------------- Đợt nhận hồ sơ ---------------- */

export async function getRounds(): Promise<NoxhRound[]> {
  const sites = await companySites();
  const rounds = await settleAll(sites, async (s) => {
    const list = (await call<Omit<NoxhRound, 'company_id' | 'slug' | 'ten_chu_dau_tu'>[] | null>('fn_portal_noxh_dot_list', { p_slug: s.slug })) ?? [];
    return list.map((r) => {
      roundSite.set(r.id, { companyId: s.companyId, slug: s.slug });
      return { ...r, company_id: s.companyId, slug: s.slug, ten_chu_dau_tu: s.companyName };
    });
  });
  return rounds.sort((a, b) => (statusRank[a.tinh_trang] ?? 9) - (statusRank[b.tinh_trang] ?? 9) || a.tu_ngay.localeCompare(b.tu_ngay));
}

export async function getRound(id: string): Promise<NoxhRoundDetail> {
  const site = await siteOfRound(id);
  const r = await call<Omit<NoxhRoundDetail, 'company_id' | 'slug' | 'ten_chu_dau_tu'> | null>('fn_portal_noxh_dot_get', { p_slug: site.slug, p_dot_id: id });
  if (!r) throw new ServiceError('Không tìm thấy đợt nhận hồ sơ', 'NOT_FOUND');
  const name = getSessionCompanies().find((c) => c.companyId === site.companyId)?.companyName ?? '';
  return { ...r, company_id: site.companyId, slug: site.slug, ten_chu_dau_tu: name };
}

export async function getLoaiCan(dotId: string): Promise<NoxhLoaiCan[]> {
  const site = await siteOfRound(dotId);
  return (await call<NoxhLoaiCan[] | null>('fn_portal_noxh_loai_can', { p_slug: site.slug, p_dot_id: dotId })) ?? [];
}

/* ---------------- Tài khoản ---------------- */

/** Thông tin tài khoản NOXH ở một công ty (`co_cccd`: đã có CCCD để nộp hồ sơ online). */
export async function getNoxhAccount(companyId: string): Promise<NoxhAccountInfo> {
  const link = linkOf(companyId);
  const info = await call<Partial<NoxhAccountInfo> | null>('fn_portal_noxh_tai_khoan', { p_token: link.token }, link.companyId);
  return { cccd: info?.cccd ?? null, di_dong: info?.di_dong ?? null, co_cccd: !!info?.co_cccd };
}

/** Khách tự khai CCCD cho tài khoản chưa có (máy chủ chặn CCCD của khách khác / lệch hồ sơ khách). Trả CCCD đã che. */
export async function updateCccd(companyId: string, cccd: string): Promise<{ cccd: string }> {
  const link = linkOf(companyId);
  return call<{ cccd: string }>('fn_portal_noxh_cap_nhat_cccd', { p_token: link.token, p_cccd: normalizeCccd(cccd) }, link.companyId);
}

/* ---------------- Hồ sơ ---------------- */

export async function getMyApplications(): Promise<NoxhApplicationRow[]> {
  return settleAll(getNoxhLinks(), async (l) => {
    const rows = (await call<Omit<NoxhApplicationRow, 'company_id'>[] | null>('fn_portal_noxh_ho_so_list', { p_token: l.token }, l.companyId)) ?? [];
    return rows.map((r) => {
      hoSoCompany.set(r.id, l.companyId);
      return { ...r, company_id: l.companyId };
    });
  });
}

export async function getApplication(id: string): Promise<NoxhApplicationDetail> {
  const known = hoSoCompany.get(id);
  const links = known ? [linkOf(known)] : getNoxhLinks();
  for (const l of links) {
    try {
      const d = await call<Omit<NoxhApplicationDetail, 'company_id'> | null>('fn_portal_noxh_ho_so_get', { p_token: l.token, p_id: id }, l.companyId);
      if (d) {
        hoSoCompany.set(id, l.companyId);
        return { ...d, company_id: l.companyId };
      }
    } catch (e) {
      // Hồ sơ của công ty khác → máy chủ báo không tìm thấy; thử công ty tiếp theo. Lỗi phiên / mạng thì ném ngay.
      if (e instanceof ServiceError && (e.code === 'UNAUTHORIZED' || e.code === 'NETWORK' || known)) throw e;
    }
  }
  throw new ServiceError('Không tìm thấy hồ sơ', 'NOT_FOUND');
}

/** Lưu nháp / sửa / nộp — `fn_portal_noxh_ho_so_save(p_token, p_payload, p_submit)`. */
export async function saveApplication(payload: NoxhSavePayload, submit: boolean): Promise<NoxhSaveResult> {
  const companyId = payload.id ? await companyOfApplication(payload.id) : (await siteOfRound(payload.dot_id)).companyId;
  const link = linkOf(companyId);
  const res = await rpc<Envelope<NoxhSaveResult> & { ho_so_id?: string }>('fn_portal_noxh_ho_so_save', { p_token: link.token, p_payload: payload, p_submit: submit });
  // Trùng hồ sơ cùng dự án → máy chủ trả kèm `ho_so_id` để mở hồ sơ đó.
  if (res?.error && typeof res.ho_so_id === 'string') {
    hoSoCompany.set(res.ho_so_id, companyId);
    throw new NoxhConflictError(res.error, res.ho_so_id);
  }
  const saved = unwrap(res, companyId);
  hoSoCompany.set(saved.id, companyId);
  return saved;
}

export async function deleteApplication(id: string): Promise<void> {
  const link = linkOf(await companyOfApplication(id));
  await call('fn_portal_noxh_ho_so_delete', { p_token: link.token, p_id: id }, link.companyId);
  hoSoCompany.delete(id);
}

export async function sendSupplement(id: string): Promise<NoxhSaveResult> {
  const link = linkOf(await companyOfApplication(id));
  const res = await call<{ id: string; trang_thai: NoxhSaveResult['trang_thai']; so_ho_so?: string }>('fn_portal_noxh_ho_so_gui_bo_sung', { p_token: link.token, p_id: id }, link.companyId);
  return { id: res.id, trang_thai: res.trang_thai, so_ho_so: res.so_ho_so ?? '' };
}

/* ---------------- Giấy tờ ---------------- */

async function attach(link: CompanyNoxhLink, hoSoId: string, docId: string, path: string | null, ten: string | null, size: number | null): Promise<NoxhDoc> {
  const res = await call<{ giay_to: NoxhDoc }>(
    'fn_portal_noxh_file_attach',
    { p_token: link.token, p_ho_so_id: hoSoId, p_giay_to_id: docId, p_path: path, p_ten: ten, p_size: size },
    link.companyId,
  );
  return res.giay_to;
}

/**
 * Tải tệp cho một giấy tờ: kiểm đuôi / dung lượng / HEIC trước (nếu biết định dạng của giấy tờ) → xin URL ký →
 * PUT tệp lên `drive-files` → gắn vào giấy tờ. Máy chủ kiểm lại đuôi, MIME, dung lượng thật của tệp.
 */
export async function uploadDoc(hoSoId: string, docId: string, file: UploadableFile, rule?: Pick<NoxhDoc, 'dinh_dang' | 'dung_luong_mb'>): Promise<NoxhDoc> {
  const check = validateNoxhFile(file, rule?.dinh_dang ?? ['pdf', 'doc', 'docx', 'jpg', 'png', 'xls', 'xlsx'], rule?.dung_luong_mb ?? 20);
  if (!check.ok) throw new ServiceError(check.message, 'UNKNOWN', docId);
  const link = linkOf(await companyOfApplication(hoSoId));
  const signed = await edgeCall<{ path?: string; token?: string }>(
    { action: 'upload-url', token: link.token, ho_so_id: hoSoId, giay_to_id: docId, ten: file.name, size: file.size, type: file.type ?? '' },
    link.companyId,
  );
  if (!signed?.path || !signed.token) throw new ServiceError('Không tạo được liên kết tải lên');
  await uploadToSignedUrl(BUCKET, signed.path, signed.token, file);
  return attach(link, hoSoId, docId, signed.path, file.name, file.size);
}

/** Bỏ tệp đã tải (máy chủ kiểm quyền theo trạng thái hồ sơ). */
export async function removeDoc(hoSoId: string, docId: string): Promise<NoxhDoc> {
  return attach(linkOf(await companyOfApplication(hoSoId)), hoSoId, docId, null, null, null);
}

/** URL ký (600 giây) xem tệp đã nộp / tệp mẫu — chỉ trả URL http(s). */
export async function openDoc(hoSoId: string, docId: string, loai: 'tep' | 'mau'): Promise<string> {
  const link = linkOf(await companyOfApplication(hoSoId));
  const res = await edgeCall<{ url?: string }>({ action: 'download-url', token: link.token, ho_so_id: hoSoId, giay_to_id: docId, loai }, link.companyId);
  const url = publicStorageUrl(String(res?.url ?? ''));
  if (!/^https?:\/\//i.test(url)) throw new ServiceError('Không mở được tệp');
  return url;
}

/* ---------------- Bốc thăm ---------------- */

export async function getMyLotteries(): Promise<NoxhLotteryMine> {
  let serverNow = new Date().toISOString();
  const items = await settleAll(getNoxhLinks(), async (l) => {
    const mine = await call<{ server_now: string; items: Omit<NoxhLotteryItem, 'company_id'>[] } | null>('fn_portal_noxh_boc_tham_cua_toi', { p_token: l.token }, l.companyId);
    if (mine?.server_now) serverNow = mine.server_now;
    return (mine?.items ?? []).map((i) => {
      lotteryCompany.set(i.bt_ho_so_id, l.companyId);
      return { ...i, company_id: l.companyId };
    });
  });
  return { server_now: serverNow, items: items.sort((a, b) => a.tu_ngay.localeCompare(b.tu_ngay)) };
}

/** Quay — idempotent ở máy chủ (đã mở thì trả lại kết quả cũ). */
export async function spinLottery(btHoSoId: string): Promise<NoxhSpinResult> {
  if (!lotteryCompany.has(btHoSoId)) await getMyLotteries();
  const link = linkOf(lotteryCompany.get(btHoSoId));
  return call<NoxhSpinResult>('fn_portal_noxh_boc_tham_quay', { p_token: link.token, p_bt_ho_so_id: btHoSoId }, link.companyId);
}

interface PublishedRaw {
  id: string;
  ma_dot: string;
  ten: string;
  da_project_id: string;
  ten_du_an: string | null;
  tong_ho_so: number;
  so_trung: number;
  phien?: unknown[] | null;
  ket_qua?: NoxhPublishedRow[] | null;
}

const toPublished = (raw: PublishedRaw, companyId: string): NoxhPublishedLottery => ({
  bt_id: raw.id,
  company_id: companyId,
  ma_dot: raw.ma_dot,
  ten: raw.ten,
  ten_du_an: raw.ten_du_an,
  tong_ho_so: raw.tong_ho_so ?? 0,
  so_trung: raw.so_trung ?? 0,
  so_phien: raw.phien?.length ?? 0,
  ...(raw.ket_qua ? { rows: raw.ket_qua } : {}),
});

/** Đợt đã công bố của các website NOXH (danh sách, chưa kèm kết quả). */
export async function getPublishedResults(): Promise<NoxhPublishedLottery[]> {
  const sites = await companySites();
  return settleAll(sites, async (s) => {
    const list = (await call<PublishedRaw[] | null>('fn_portal_noxh_boc_tham_cong_bo', { p_slug: s.slug, p_da_project_id: null })) ?? [];
    return list.map((raw) => {
      publishedSite.set(raw.id, { companyId: s.companyId, slug: s.slug, projectId: raw.da_project_id });
      return toPublished({ ...raw, ket_qua: null }, s.companyId);
    });
  });
}

/** Kết quả của một đợt đã công bố (máy chủ trả kết quả theo dự án). */
export async function getPublishedResult(btId: string): Promise<NoxhPublishedLottery> {
  if (!publishedSite.has(btId)) await getPublishedResults();
  const site = publishedSite.get(btId);
  if (!site) throw new ServiceError('Không tìm thấy đợt bốc thăm', 'NOT_FOUND');
  const list = (await call<PublishedRaw[] | null>('fn_portal_noxh_boc_tham_cong_bo', { p_slug: site.slug, p_da_project_id: site.projectId })) ?? [];
  const raw = list.find((x) => x.id === btId);
  if (!raw) throw new ServiceError('Không tìm thấy đợt bốc thăm', 'NOT_FOUND');
  return { ...toPublished(raw, site.companyId), rows: raw.ket_qua ?? [] };
}

/* ---------------- Thông báo ---------------- */

export async function getNoxhNotifications(): Promise<NoxhNotification[]> {
  return settleAll(getNoxhLinks(), async (l) => {
    const res = await call<{ items: Omit<NoxhNotification, 'company_id'>[] } | null>(
      'fn_portal_noxh_thong_bao',
      { p_token: l.token, p_chi_chua_doc: false, p_limit: 50 },
      l.companyId,
    );
    return (res?.items ?? []).map((n) => {
      notificationCompany.set(n.id, l.companyId);
      return { ...n, company_id: l.companyId };
    });
  });
}

/** Đánh dấu đã đọc theo công ty của từng thông báo; `ids = null` → tất cả ở mọi công ty. */
export async function markNoxhNotificationsRead(ids: string[] | null): Promise<void> {
  const links = getNoxhLinks();
  const groups: { link: CompanyNoxhLink; ids: string[] | null }[] =
    ids === null
      ? links.map((link) => ({ link, ids: null }))
      : links.flatMap((link) => {
          const mine = ids.filter((id) => notificationCompany.get(id) === link.companyId);
          return mine.length ? [{ link, ids: mine }] : [];
        });
  await Promise.all(groups.map((g) => call('fn_portal_noxh_thong_bao_da_doc', { p_token: g.link.token, p_ids: g.ids }, g.link.companyId)));
}
