/**
 * Nhà ở xã hội — lớp truy cập dữ liệu (`fn_portal_noxh_*` của web `beeland`).
 *
 * - Mock (`NOXH_BACKEND = 'mock'`, mặc định): dữ liệu `data/mock/noxh.ts`, giữ trạng thái trong bộ nhớ, áp CÙNG luật
 *   như máy chủ (quyền theo trạng thái, thiếu giấy tờ bắt buộc không nộp được, quay lại cho cùng kết quả…).
 * - API (`NOXH_BACKEND = 'api'`, đi theo `AUTH_BACKEND`): `services/noxhApi.ts` — cùng luồng với web.
 *
 * Khách được xác định theo token phiên NOXH (`CompanySession.noxh`), không theo tham số client.
 */
import { mockCustomerRecords } from '@/data/mock/user';
import {
  mockAccountCccd,
  mockApplications,
  mockCustomerCccd,
  mockLoaiCanByProject,
  mockLotteries,
  mockNoxhCustomers,
  mockNoxhNotifications,
  mockPublished,
  mockRounds,
  newDocs,
  type MockApplication,
  type MockLottery,
} from '@/data/mock/noxh';
import { mockProvinces, mockWards } from '@/data/mock/provinces';
import {
  applicationQuyen,
  normalizeCccd,
  isNoxhSessionExpired,
  lotteryPhase,
  missingRequiredDocs,
  personalInfoMissing,
  roundStatus,
  validateNoxhFile,
} from '@/lib/noxh';
import type {
  NoxhAccountInfo,
  NoxhApplicationDetail,
  NoxhApplicationRow,
  NoxhCustomerSnapshot,
  NoxhDoc,
  NoxhLoaiCan,
  NoxhLotteryItem,
  NoxhLotteryMine,
  NoxhNotification,
  NoxhPublishedLottery,
  NoxhRound,
  NoxhRoundDetail,
  NoxhSaveResult,
  NoxhSavePayload,
  NoxhSpinResult,
  NoxhStatus,
} from '@/types';

import { NOXH_BACKEND } from './config';
import { ServiceError } from './errors';
import * as api from './noxhApi';
import { NoxhConflictError } from './noxhErrors';
import { clone, simulateLatency } from './mockLatency';
import { getNoxhLinks, getSessionCompanyIds, type CompanyNoxhLink } from './session';
import type { UploadableFile } from './supabase/storage';

export { NoxhConflictError } from './noxhErrors';

/** Tệp người dùng chọn (ảnh chụp / thư viện / tệp); web có `blob`. */
export type PickedFile = UploadableFile;

const NEED_CONNECT = 'Vui lòng kết nối tài khoản Nhà ở xã hội để tiếp tục.';
const NOT_FOUND_APP = 'Không tìm thấy hồ sơ';

/* ================================================================ mock ================================================================ */

/** Token mock mã hoá chủ hồ sơ như máy chủ nhận ra khách qua token phiên: `mock-noxh:<companyId>:<SĐT>`. */
export const mockNoxhToken = (companyId: string, phone: string) => `mock-noxh:${companyId}:${phone}`;
const ownerOf = (link: CompanyNoxhLink) => link.token.split(':')[2] ?? '';

const db = {
  rounds: clone(mockRounds),
  apps: clone(mockApplications),
  lotteries: clone(mockLotteries),
  notifications: clone(mockNoxhNotifications),
  accountCccd: { ...mockAccountCccd },
  customerCccd: { ...mockCustomerCccd },
  seq: 500,
};

const owns = (companyId: string, owner: string) => getNoxhLinks().some((l) => l.companyId === companyId && ownerOf(l) === owner);
const myApps = () => db.apps.filter((a) => owns(a.company_id, a.owner));

function requireApp(id: string): MockApplication {
  const app = myApps().find((a) => a.id === id);
  if (!app) throw new ServiceError(NOT_FOUND_APP, 'NOT_FOUND');
  return app;
}

const statusRank: Record<string, number> = { DANG_MO: 0, SAP_MO: 1, DA_DONG: 2, CHUA_CONG_BO: 3 };

function liveRound<T extends NoxhRound & { cong_bo: boolean }>(r: T, now: number): T {
  return { ...clone(r), tinh_trang: roundStatus(r, now) };
}

function roundOf(app: MockApplication) {
  return db.rounds.find((r) => r.id === app.dot_id) ?? null;
}

function isRoundOpen(dotId: string | null): boolean {
  const r = db.rounds.find((x) => x.id === dotId);
  return !!r && roundStatus(r, Date.now()) === 'DANG_MO';
}

function toRow(a: MockApplication): NoxhApplicationRow {
  const required = a.giay_to;
  return {
    id: a.id,
    company_id: a.company_id,
    so_ho_so: a.so_ho_so,
    trang_thai: a.trang_thai,
    ten_du_an: a.ten_du_an,
    ten_dot: roundOf(a)?.ten ?? null,
    ten_nhom: a.ten_nhom,
    ngay_tiep_nhan: a.ngay_tiep_nhan,
    updated_at: a.updated_at,
    so_giay_to: required.length,
    so_da_nop: required.filter((d) => !!d.tep_ten).length,
    so_dat: required.filter((d) => d.trang_thai === 'DAT').length,
    so_can_bo_sung: required.filter((d) => d.trang_thai === 'CHUA_DAT' || (d.bat_buoc && d.trang_thai === 'CHUA_CUNG_CAP')).length,
  };
}

function lotteryOf(app: MockApplication): MockLottery | undefined {
  return db.lotteries.find((l) => l.ho_so_id === app.id);
}

function toDetail(a: MockApplication): NoxhApplicationDetail {
  const r = roundOf(a);
  const now = Date.now();
  const lot = lotteryOf(a);
  const { owner: _owner, supplement_since, ...rest } = clone(a);
  return {
    ...rest,
    dot: r ? { id: r.id, ten: r.ten, tu_ngay: r.tu_ngay, den_ngay: r.den_ngay, tinh_trang: roundStatus(r, now) } : null,
    quyen: applicationQuyen(a.trang_thai, a.nguon, a.giay_to, isRoundOpen(a.dot_id), supplement_since),
    boc_tham: lot
      ? {
          bt_ho_so_id: lot.bt_ho_so_id,
          ma_dot: lot.ma_dot,
          ten: lot.ten,
          tu_ngay: lot.tu_ngay,
          den_ngay: lot.den_ngay,
          trang_thai: lot.trang_thai,
          server_now: new Date(now).toISOString(),
          da_quay: !!lot.mo_luc,
          ...(lot.mo_luc
            ? {
                ket_qua: lot.ket_qua_dinh_san.ket_qua,
                can: lot.ket_qua_dinh_san.can ? { ky_hieu: lot.ket_qua_dinh_san.can.ky_hieu } : null,
                thu_tu_du_phong: lot.ket_qua_dinh_san.thu_tu_du_phong,
              }
            : {}),
        }
      : null,
  };
}

function toLotteryItem(l: MockLottery): NoxhLotteryItem {
  const { ho_so_id: _h, ket_qua_dinh_san, mo_luc, ...rest } = clone(l);
  return { ...rest, da_quay: !!mo_luc, ...(mo_luc ? { ...ket_qua_dinh_san, mo_luc } : {}) };
}

function pushHistory(a: MockApplication, to: NoxhStatus, reason: string | null = null) {
  const at = new Date().toISOString();
  a.lich_su.push({ thoi_diem: at, tu_trang_thai: a.trang_thai, den_trang_thai: to, ly_do: reason });
  a.trang_thai = to;
  a.updated_at = at;
}

const todayVN = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

const MISSING_CCCD = 'Tài khoản chưa có CCCD, vui lòng liên hệ chủ đầu tư để cập nhật trước khi nộp hồ sơ online';
const ACCOUNT_KEY = (companyId: string, owner: string) => `${companyId}:${owner}`;

async function mockSave(payload: NoxhSavePayload, submit: boolean): Promise<NoxhSaveResult> {
  await simulateLatency();
  // Như máy chủ: tài khoản chưa có CCCD thì không tạo / sửa hồ sơ online được.
  const companyOfSave = payload.id ? requireApp(payload.id).company_id : db.rounds.find((r) => r.id === payload.dot_id)?.company_id;
  const saveLink = getNoxhLinks().find((l) => l.companyId === companyOfSave);
  if (saveLink && !db.accountCccd[ACCOUNT_KEY(saveLink.companyId, ownerOf(saveLink))]) throw new ServiceError(MISSING_CCCD);
  let app: MockApplication;
  if (payload.id) {
    app = requireApp(payload.id);
    const quyen = applicationQuyen(app.trang_thai, app.nguon, app.giay_to, isRoundOpen(app.dot_id), app.supplement_since);
    if (!quyen.sua_thong_tin) throw new ServiceError('Hồ sơ đã nộp, không sửa được thông tin.', 'CONFLICT');
  } else {
    const round = db.rounds.find((r) => r.id === payload.dot_id && getSessionCompanyIds().includes(r.company_id));
    if (!round) throw new ServiceError('Không tìm thấy đợt nhận hồ sơ', 'NOT_FOUND');
    if (roundStatus(round, Date.now()) !== 'DANG_MO') throw new ServiceError('Đợt nhận hồ sơ chưa mở hoặc đã kết thúc.');
    const link = getNoxhLinks().find((l) => l.companyId === round.company_id);
    if (!link) throw new ServiceError(NEED_CONNECT, 'UNAUTHORIZED');
    const owner = ownerOf(link);
    const existing = db.apps.find(
      (a) => a.owner === owner && a.company_id === round.company_id && a.da_project_id === round.da_project_id && a.trang_thai !== 'KHONG_DAT' && a.trang_thai !== 'RUT_HO_SO',
    );
    if (existing) throw new NoxhConflictError('Bạn đã có hồ sơ tại dự án này.', existing.id);
    const base = mockNoxhCustomers[owner];
    if (!base) throw new ServiceError(NEED_CONNECT, 'UNAUTHORIZED');
    const id = `hs-${++db.seq}`;
    const now = new Date().toISOString();
    app = {
      id,
      owner,
      company_id: round.company_id,
      so_ho_so: `NOXH-${now.slice(0, 4)}-${String(db.seq).padStart(6, '0')}`,
      trang_thai: 'NHAP',
      nguon: 'PORTAL',
      da_project_id: round.da_project_id,
      ten_du_an: round.ten_du_an,
      dot_id: round.id,
      dot: null,
      nhom_doi_tuong_id: '',
      ten_nhom: null,
      loai_can_id: null,
      ten_loai_can: null,
      ngay_tiep_nhan: todayVN(),
      created_at: now,
      updated_at: now,
      kh_snapshot: clone(base),
      giay_to: newDocs(id, null),
      lich_su: [{ thoi_diem: now, tu_trang_thai: null, den_trang_thai: 'NHAP', ly_do: null }],
      supplement_since: null,
    };
    db.apps.push(app);
  }

  // Nhóm đối tượng (chỉ khi nháp) — phải thuộc đợt.
  const round = roundOf(app);
  if (payload.nhom_doi_tuong_id && payload.nhom_doi_tuong_id !== app.nhom_doi_tuong_id) {
    const group = round?.nhom.find((g) => g.id === payload.nhom_doi_tuong_id);
    if (!group) throw new ServiceError('Nhóm đối tượng không thuộc đợt nhận hồ sơ.');
    app.nhom_doi_tuong_id = group.id;
    app.ten_nhom = group.ten;
  }
  if ('loai_can_id' in payload) {
    const loai = (mockLoaiCanByProject[app.da_project_id] ?? []).find((l) => l.id === payload.loai_can_id) ?? null;
    if (payload.loai_can_id && !loai) throw new ServiceError('Loại căn hộ không thuộc dự án.');
    app.loai_can_id = loai?.id ?? null;
    app.ten_loai_can = loai?.ten ?? null;
  }
  const kh = payload.khach_hang;
  const blankAddr = { dia_chi: '', ma_xa: '', ten_xa: '', ma_tinh: '', ten_tinh: '' };
  if (payload.id) {
    // Giống fn_portal_noxh_ho_so_save: hồ sơ đã có → DỰNG LẠI bản chụp từ payload (khoá vắng = trống), CCCD / mã KH / ảnh giữ nguyên,
    // SĐT = SĐT tài khoản, trống thì lấy payload. Gửi thiếu trường là mất trường đó — mock phải lộ lỗi này như máy chủ thật.
    const prev = app.kh_snapshot;
    app.kh_snapshot = {
      ...prev,
      ten_kh: kh.ten_kh ?? '',
      ngay_sinh: kh.ngay_sinh ?? null,
      gioi_tinh: kh.gioi_tinh ?? '',
      ngay_cap: kh.ngay_cap ?? null,
      noi_cap: kh.noi_cap ?? '',
      di_dong: kh.di_dong ?? '',
      email: kh.email ?? '',
      hien_tai_giong_thuong_tru: kh.hien_tai_giong_thuong_tru ?? true,
      thuong_tru: { ...blankAddr, ...kh.thuong_tru },
      hien_tai: { ...blankAddr, ...kh.hien_tai },
    };
  } else {
    // Tạo mới: mock lấy sẵn hồ sơ khách làm bản chụp rồi ghi đè trường có gửi (CCCD theo tài khoản).
    const { thuong_tru, hien_tai, cccd: _cccd, ...info } = kh;
    Object.assign(app.kh_snapshot, info);
    if (thuong_tru) app.kh_snapshot.thuong_tru = { ...app.kh_snapshot.thuong_tru, ...thuong_tru };
    if (hien_tai) app.kh_snapshot.hien_tai = { ...app.kh_snapshot.hien_tai, ...hien_tai };
  }
  const snap = app.kh_snapshot;
  if (snap.hien_tai_giong_thuong_tru) snap.hien_tai = { ...snap.thuong_tru };
  app.updated_at = new Date().toISOString();

  if (submit) {
    if (app.trang_thai !== 'NHAP') throw new ServiceError('Hồ sơ đã được tiếp nhận.', 'CONFLICT');
    if (!isRoundOpen(app.dot_id)) throw new ServiceError('Đợt nhận hồ sơ đã kết thúc, không nộp được hồ sơ.');
    const missingInfo = [...(app.nhom_doi_tuong_id ? [] : ['Nhóm đối tượng']), ...personalInfoMissing(snap, app.loai_can_id)];
    if (missingInfo.length) throw new ServiceError(`Chưa đủ thông tin: ${missingInfo.join(', ')}`);
    const missingDocs = missingRequiredDocs(app.giay_to);
    if (missingDocs.length) throw new ServiceError(`Chưa nộp giấy tờ bắt buộc: ${missingDocs.map((d) => d.ten).join(', ')}`);
    app.ngay_tiep_nhan = todayVN();
    pushHistory(app, 'MOI_TIEP_NHAN');
    if (round) round.so_ho_so_da_nop += 1;
  }
  return { id: app.id, so_ho_so: app.so_ho_so, trang_thai: app.trang_thai };
}

function requireEditableDoc(hoSoId: string, docId: string): { app: MockApplication; doc: NoxhDoc } {
  const app = requireApp(hoSoId);
  const doc = app.giay_to.find((d) => d.id === docId);
  if (!doc) throw new ServiceError('Không tìm thấy giấy tờ', 'NOT_FOUND');
  const quyen = applicationQuyen(app.trang_thai, app.nguon, app.giay_to, isRoundOpen(app.dot_id), app.supplement_since);
  if (!quyen.sua_giay_to.includes(docId)) throw new ServiceError('Giấy tờ này không thay đổi được ở trạng thái hiện tại.', 'CONFLICT');
  return { app, doc };
}

function requireMyLottery(btHoSoId: string): MockLottery {
  const lot = db.lotteries.find((l) => l.bt_ho_so_id === btHoSoId && myApps().some((a) => a.id === l.ho_so_id));
  if (!lot) throw new ServiceError('Không tìm thấy lượt bốc thăm', 'NOT_FOUND');
  return lot;
}

/* ================================================================ public ================================================================ */

/** Đợt nhận hồ sơ của các chủ đầu tư khách đã có tài khoản — Đang mở → Sắp mở → Đã đóng. */
export async function getRounds(): Promise<NoxhRound[]> {
  if (NOXH_BACKEND === 'api') return api.getRounds();
  await simulateLatency();
  const now = Date.now();
  const companies = getSessionCompanyIds();
  return db.rounds
    .filter((r) => r.cong_bo && companies.includes(r.company_id))
    .map((r) => {
      const { cong_bo: _c, mo_ta: _m, nhom: _n, da_project_id: _p, ...round } = liveRound(r, now);
      return round;
    })
    .sort((a, b) => statusRank[a.tinh_trang] - statusRank[b.tinh_trang] || a.tu_ngay.localeCompare(b.tu_ngay));
}

export async function getRound(id: string): Promise<NoxhRoundDetail> {
  if (NOXH_BACKEND === 'api') return api.getRound(id);
  await simulateLatency();
  const r = db.rounds.find((x) => x.id === id && x.cong_bo && getSessionCompanyIds().includes(x.company_id));
  if (!r) throw new ServiceError('Không tìm thấy đợt nhận hồ sơ', 'NOT_FOUND');
  const { cong_bo: _c, ...detail } = liveRound(r, Date.now());
  return detail;
}

/** Loại căn hộ của dự án thuộc đợt. */
export async function getLoaiCan(dotId: string): Promise<NoxhLoaiCan[]> {
  if (NOXH_BACKEND === 'api') return api.getLoaiCan(dotId);
  await simulateLatency(150, 300);
  const r = db.rounds.find((x) => x.id === dotId);
  return clone(mockLoaiCanByProject[r?.da_project_id ?? ''] ?? []);
}

/** Hồ sơ của khách ở mọi công ty đã kết nối NOXH (chưa kết nối → rỗng). */
export async function getMyApplications(): Promise<NoxhApplicationRow[]> {
  if (NOXH_BACKEND === 'api') return api.getMyApplications();
  await simulateLatency();
  return myApps()
    .map(toRow)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getApplication(id: string): Promise<NoxhApplicationDetail> {
  if (NOXH_BACKEND === 'api') return api.getApplication(id);
  await simulateLatency();
  return toDetail(requireApp(id));
}

/** Lưu nháp / sửa (`submit = false`) hoặc nộp hồ sơ (`submit = true`). */
export async function saveApplication(payload: NoxhSavePayload, submit: boolean): Promise<NoxhSaveResult> {
  if (NOXH_BACKEND === 'api') return api.saveApplication(payload, submit);
  return mockSave(payload, submit);
}

/** Xoá hồ sơ chưa nộp. */
export async function deleteApplication(id: string): Promise<void> {
  if (NOXH_BACKEND === 'api') return api.deleteApplication(id);
  await simulateLatency();
  const app = requireApp(id);
  if (app.trang_thai !== 'NHAP') throw new ServiceError('Chỉ xoá được hồ sơ chưa nộp.', 'CONFLICT');
  db.apps = db.apps.filter((a) => a.id !== id);
}

/** Tải tệp cho một giấy tờ (kiểm định dạng / dung lượng trước). */
export async function uploadDoc(hoSoId: string, docId: string, file: PickedFile, rule?: Pick<NoxhDoc, 'dinh_dang' | 'dung_luong_mb'>): Promise<NoxhDoc> {
  if (NOXH_BACKEND === 'api') return api.uploadDoc(hoSoId, docId, file, rule);
  const { doc } = requireEditableDoc(hoSoId, docId);
  const check = validateNoxhFile(file, doc.dinh_dang, doc.dung_luong_mb);
  if (!check.ok) throw new ServiceError(check.message, 'UNKNOWN', docId);
  await simulateLatency(800, 1500);
  Object.assign(doc, { tep_ten: file.name, tep_kich_thuoc: file.size, ngay_nop: new Date().toISOString(), trang_thai: 'CHO_THAM_DINH', ly_do: null });
  return clone(doc);
}

/** Bỏ tệp đã tải của một giấy tờ. */
export async function removeDoc(hoSoId: string, docId: string): Promise<NoxhDoc> {
  if (NOXH_BACKEND === 'api') return api.removeDoc(hoSoId, docId);
  await simulateLatency(150, 300);
  const { doc } = requireEditableDoc(hoSoId, docId);
  Object.assign(doc, { tep_ten: null, tep_kich_thuoc: null, ngay_nop: null, trang_thai: 'CHUA_CUNG_CAP' });
  return clone(doc);
}

/** URL ký (600 giây) để xem tệp đã nộp / tệp mẫu. Mock: không có tệp thật → `null`. */
export async function openDoc(hoSoId: string, docId: string, loai: 'tep' | 'mau'): Promise<string | null> {
  if (NOXH_BACKEND === 'api') return api.openDoc(hoSoId, docId, loai);
  await simulateLatency(150, 300);
  const app = requireApp(hoSoId);
  const doc = app.giay_to.find((d) => d.id === docId);
  if (!doc || (loai === 'tep' && !doc.tep_ten) || (loai === 'mau' && !doc.co_mau)) throw new ServiceError('Không mở được tệp', 'NOT_FOUND');
  return null;
}

/** Gửi bổ sung: mọi giấy tờ bắt buộc chưa đạt phải có tệp mới → Đang kiểm tra. */
export async function sendSupplement(hoSoId: string): Promise<NoxhSaveResult> {
  if (NOXH_BACKEND === 'api') return api.sendSupplement(hoSoId);
  await simulateLatency();
  const app = requireApp(hoSoId);
  if (app.trang_thai !== 'CAN_BO_SUNG') throw new ServiceError('Hồ sơ không ở trạng thái cần bổ sung.', 'CONFLICT');
  const pending = app.giay_to.filter((d) => d.bat_buoc && (d.trang_thai === 'CHUA_DAT' || d.trang_thai === 'CHUA_CUNG_CAP'));
  if (pending.length) throw new ServiceError(`Chưa bổ sung giấy tờ: ${pending.map((d) => d.ten).join(', ')}`);
  pushHistory(app, 'DANG_THAM_DINH');
  app.supplement_since = null;
  return { id: app.id, so_ho_so: app.so_ho_so, trang_thai: app.trang_thai };
}

/** Các lượt bốc thăm của khách + giờ máy chủ. */
export async function getMyLotteries(): Promise<NoxhLotteryMine> {
  if (NOXH_BACKEND === 'api') return api.getMyLotteries();
  await simulateLatency();
  const ids = new Set(myApps().map((a) => a.id));
  return {
    server_now: new Date().toISOString(),
    items: db.lotteries.filter((l) => ids.has(l.ho_so_id)).map(toLotteryItem).sort((a, b) => a.tu_ngay.localeCompare(b.tu_ngay)),
  };
}

/** Quay: chỉ "mở" kết quả đã định lúc mở đợt; gọi lại / đồng thời → cùng kết quả. */
export async function spinLottery(btHoSoId: string): Promise<NoxhSpinResult> {
  if (NOXH_BACKEND === 'api') return api.spinLottery(btHoSoId);
  await simulateLatency(400, 900);
  const lot = requireMyLottery(btHoSoId);
  if (!lot.mo_luc) {
    const phase = lotteryPhase({ ...lot, da_quay: false }, Date.now());
    if (phase === 'upcoming') throw new ServiceError('Chưa đến giờ bốc thăm');
    if (phase !== 'open') throw new ServiceError('Đợt bốc thăm đã kết thúc');
    lot.mo_luc = new Date().toISOString();
  }
  return { ...clone(lot.ket_qua_dinh_san), mo_luc: lot.mo_luc };
}

/** Kết quả các đợt bốc thăm đã công bố (không có họ tên/CCCD). */
export async function getPublishedResults(): Promise<NoxhPublishedLottery[]> {
  if (NOXH_BACKEND === 'api') return api.getPublishedResults();
  await simulateLatency();
  // Chỉ đợt của chủ đầu tư khách có tài khoản (bản dựng dùng đăng nhập thật không lẫn dữ liệu mẫu).
  const companies = getSessionCompanyIds();
  return clone(mockPublished.filter((p) => companies.includes(p.company_id)));
}

/** Kết quả của một đợt đã công bố. */
export async function getPublishedResult(btId: string): Promise<NoxhPublishedLottery> {
  if (NOXH_BACKEND === 'api') return api.getPublishedResult(btId);
  await simulateLatency();
  const found = (await getPublishedResults()).find((p) => p.bt_id === btId);
  if (!found) throw new ServiceError('Không tìm thấy đợt bốc thăm', 'NOT_FOUND');
  return found;
}

/** Thông báo NOXH (lịch bốc thăm, kết quả, huỷ đợt). */
export async function getNoxhNotifications(): Promise<NoxhNotification[]> {
  if (NOXH_BACKEND === 'api') return api.getNoxhNotifications();
  await simulateLatency(150, 300);
  return db.notifications
    .filter((n) => owns(n.company_id, n.owner))
    .map(({ owner: _o, ...n }) => clone(n))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Đánh dấu đã đọc (`ids = null`: tất cả). */
export async function markNoxhNotificationsRead(ids: string[] | null): Promise<void> {
  if (NOXH_BACKEND === 'api') return api.markNoxhNotificationsRead(ids);
  await simulateLatency(100, 200);
  const at = new Date().toISOString();
  for (const n of db.notifications) {
    if (!owns(n.company_id, n.owner)) continue;
    if (ids === null || ids.includes(n.id)) n.da_doc_luc = n.da_doc_luc ?? at;
  }
}

/* ---------------- Tài khoản NOXH (CCCD) ---------------- */

const maskCccd = (c: string) => `${c.slice(0, 4)}${'*'.repeat(c.length - 8)}${c.slice(-4)}`;

function mockLink(companyId: string): CompanyNoxhLink {
  const link = getNoxhLinks().find((l) => l.companyId === companyId);
  if (!link) throw new ServiceError('Vui lòng kết nối tài khoản Nhà ở xã hội để tiếp tục.', 'UNAUTHORIZED');
  return link;
}

/** Tài khoản NOXH ở một công ty — `co_cccd` cho biết đã nộp hồ sơ online được chưa. */
export async function getNoxhAccount(companyId: string): Promise<NoxhAccountInfo> {
  if (NOXH_BACKEND === 'api') return api.getNoxhAccount(companyId);
  await simulateLatency(150, 300);
  const link = mockLink(companyId);
  const owner = ownerOf(link);
  const cccd = db.accountCccd[ACCOUNT_KEY(companyId, owner)] ?? null;
  return { cccd: cccd ? maskCccd(cccd) : null, di_dong: owner, co_cccd: !!cccd };
}

/** Khách tự khai CCCD — mock áp đúng thứ tự kiểm của `fn_portal_noxh_cap_nhat_cccd`. */
export async function updateCccd(companyId: string, cccd: string): Promise<{ cccd: string }> {
  if (NOXH_BACKEND === 'api') return api.updateCccd(companyId, cccd);
  await simulateLatency();
  const link = mockLink(companyId);
  const key = ACCOUNT_KEY(companyId, ownerOf(link));
  const value = normalizeCccd(cccd);
  if (!/^\d{12}$/.test(value)) throw new ServiceError('Số CCCD phải gồm 12 chữ số');
  const current = db.accountCccd[key];
  if (current) {
    if (current === value) return { cccd: maskCccd(value) };
    throw new ServiceError('Tài khoản đã có CCCD, vui lòng liên hệ chủ đầu tư để thay đổi');
  }
  const customerCccd = db.customerCccd[key];
  if (customerCccd && customerCccd !== value) throw new ServiceError('CCCD không khớp hồ sơ khách hàng, vui lòng liên hệ chủ đầu tư');
  const usedByAccount = Object.entries(db.accountCccd).some(([k, c]) => k !== key && k.startsWith(`${companyId}:`) && c === value);
  const usedByCustomer = mockCustomerRecords.some(
    (r) => r.companyId === companyId && normalizeCccd(r.idNumber) === value && `${companyId}:${normalizeCccd(r.phone)}` !== key,
  );
  if (usedByAccount || usedByCustomer) throw new ServiceError('CCCD đã được dùng cho khách hàng khác, vui lòng liên hệ chủ đầu tư');
  db.accountCccd[key] = value;
  db.customerCccd[key] = db.customerCccd[key] ?? value;
  return { cccd: maskCccd(value) };
}

/* ---------------- Danh mục địa chỉ & nháp form ---------------- */

export interface Place {
  code: string;
  name: string;
}

/** Tỉnh / thành phố. */
export async function getProvinces(): Promise<Place[]> {
  await simulateLatency(100, 200);
  return clone(mockProvinces);
}

/** Phường / xã của tỉnh. */
export async function getWards(provinceCode: string): Promise<Place[]> {
  await simulateLatency(100, 200);
  return clone(mockWards[provinceCode] ?? []);
}

/**
 * Nháp form Thông tin cá nhân theo hồ sơ — chỉ trong bộ nhớ (có CCCD/SĐT nên không ghi xuống máy);
 * xoá khi lưu xong, khi nộp và khi đăng xuất.
 */
const drafts = new Map<string, { snapshot: NoxhCustomerSnapshot; loaiCanId: string | null }>();

export function getPersonalDraft(hoSoId: string) {
  return drafts.get(hoSoId) ?? null;
}

export function setPersonalDraft(hoSoId: string, snapshot: NoxhCustomerSnapshot, loaiCanId: string | null): void {
  drafts.set(hoSoId, { snapshot: clone(snapshot), loaiCanId });
}

export function clearPersonalDraft(hoSoId: string): void {
  drafts.delete(hoSoId);
}

export function clearAllPersonalDrafts(): void {
  drafts.clear();
}
