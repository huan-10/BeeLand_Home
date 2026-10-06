/**
 * Dữ liệu giả Nhà ở xã hội — CHỈ `services/noxhService.ts` được đọc.
 * Mốc thời gian tính theo lúc nạp module để luôn có đợt "đang mở", lượt bốc thăm "đang mở"… khi chạy thử.
 * Kịch bản (spec §7): đợt A mở (chưa có hồ sơ) · đợt B sắp mở · đợt C mở ở BlueSky · HS1 cần bổ sung ·
 * HS2 đang mở bốc thăm (trúng A-1205) · HS3 không đạt · HS4 (BlueSky) bốc thăm sắp diễn ra · 1 đợt đã công bố.
 */
import type {
  NoxhApplicationDetail,
  NoxhCustomerSnapshot,
  NoxhDoc,
  NoxhLoaiCan,
  NoxhLotteryItem,
  NoxhNotification,
  NoxhPublishedLottery,
  NoxhRoundDetail,
  NoxhSpinResult,
} from '@/types';

import { MOCK_COMPANIES } from './user';

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const NOW = Date.now();
/** Mốc tương đối so với lúc nạp module. */
const rel = (ms: number) => new Date(NOW + ms).toISOString();

/** Website `mau4` của từng công ty (bản thật: `cloud_customer_web_configs`, `template_code = 'mau4'`). */
export const MOCK_NOXH_SITES: Record<string, string> = {
  [MOCK_COMPANIES.sunshine.companyId]: 'sunshine-noxh',
  [MOCK_COMPANIES.bluesky.companyId]: 'bluesky-noxh',
};

/** Mật khẩu kết nối NOXH khi chạy mock (= mật khẩu đăng nhập demo). */
export const MOCK_NOXH_PASSWORD = '123456';

/* ---------------- Danh mục ---------------- */

const GROUPS = {
  congNhan: { id: 'g-cong-nhan', ten: 'Công nhân, người lao động trong doanh nghiệp, hợp tác xã', mo_ta: 'Đang làm việc theo hợp đồng lao động tại doanh nghiệp, hợp tác xã trong hoặc ngoài khu công nghiệp.' },
  thuNhapThap: { id: 'g-thu-nhap-thap', ten: 'Người thu nhập thấp khu vực đô thị', mo_ta: 'Thu nhập bình quân hằng tháng thực nhận không quá mức quy định của tỉnh, thành phố.' },
  canBo: { id: 'g-can-bo', ten: 'Cán bộ, công chức, viên chức', mo_ta: 'Theo quy định của pháp luật về cán bộ, công chức, viên chức.' },
  vuTrang: { id: 'g-vu-trang', ten: 'Lực lượng vũ trang nhân dân', mo_ta: 'Sĩ quan, quân nhân chuyên nghiệp, công nhân và viên chức quốc phòng đang tại ngũ.' },
  coCong: { id: 'g-co-cong', ten: 'Người có công với cách mạng, thân nhân liệt sĩ', mo_ta: null },
} as const;

const LOAI_CAN: NoxhLoaiCan[] = [
  { id: 'lc-1pn', ten: '1 phòng ngủ (45 m²)' },
  { id: 'lc-2pn', ten: '2 phòng ngủ (60 m²)' },
  { id: 'lc-2pn-plus', ten: '2 phòng ngủ + (70 m²)' },
];

/** Loại căn theo dự án (fn_portal_noxh_loai_can). */
export const mockLoaiCanByProject: Record<string, NoxhLoaiCan[]> = {
  'p-halong': LOAI_CAN,
  'p-green': LOAI_CAN.slice(0, 2),
  'p-songhong': LOAI_CAN.slice(1),
  'p-garden': LOAI_CAN,
  'p-riverside': LOAI_CAN,
  'p-old': LOAI_CAN.slice(0, 2),
  'p-bluesky-tower': LOAI_CAN,
};

/* ---------------- Đợt nhận hồ sơ ---------------- */

const sunshine = { company_id: MOCK_COMPANIES.sunshine.companyId, slug: 'sunshine-noxh', ten_chu_dau_tu: MOCK_COMPANIES.sunshine.companyName };
const bluesky = { company_id: MOCK_COMPANIES.bluesky.companyId, slug: 'bluesky-noxh', ten_chu_dau_tu: MOCK_COMPANIES.bluesky.companyName };

export interface MockRound extends NoxhRoundDetail {
  da_project_id: string;
  cong_bo: boolean;
}

export const mockRounds: MockRound[] = [
  {
    id: 'dot-a',
    ...sunshine,
    da_project_id: 'p-halong',
    ten: 'Nhà ở xã hội Hạ Long Bay — Đợt 1',
    ten_du_an: 'NOXH Hạ Long Bay',
    dia_chi_du_an: 'Phường Hà Khánh, TP. Hạ Long, Quảng Ninh',
    anh_url: null,
    tu_ngay: rel(-3 * DAY),
    den_ngay: rel(12 * DAY),
    so_can: 320,
    so_ho_so_da_nop: 128,
    tinh_trang: 'DANG_MO',
    cong_bo: true,
    mo_ta: 'Đợt 1 nhận hồ sơ đăng ký mua nhà ở xã hội tại dự án NOXH Hạ Long Bay.\nHồ sơ nộp online trên ứng dụng hoặc website; chủ đầu tư kiểm tra và phản hồi trong 15 ngày làm việc.',
    nhom: [GROUPS.congNhan, GROUPS.thuNhapThap, GROUPS.canBo],
  },
  {
    id: 'dot-b',
    ...sunshine,
    da_project_id: 'p-green',
    ten: 'NOXH Green River — Đợt 2',
    ten_du_an: 'NOXH Green River',
    dia_chi_du_an: 'Xã Tân Thạnh Tây, huyện Củ Chi, TP. Hồ Chí Minh',
    anh_url: null,
    tu_ngay: rel(5 * DAY),
    den_ngay: rel(35 * DAY),
    so_can: 180,
    so_ho_so_da_nop: 0,
    tinh_trang: 'SAP_MO',
    cong_bo: true,
    mo_ta: 'Đợt 2 dành cho công nhân và người lao động các khu công nghiệp lân cận.',
    nhom: [GROUPS.congNhan, GROUPS.vuTrang],
  },
  {
    id: 'dot-c',
    ...bluesky,
    da_project_id: 'p-songhong',
    ten: 'NOXH Sông Hồng — Đợt 1',
    ten_du_an: 'NOXH Sông Hồng Residence',
    dia_chi_du_an: 'Phường Long Biên, quận Long Biên, Hà Nội',
    anh_url: null,
    tu_ngay: rel(-1 * DAY),
    den_ngay: rel(20 * DAY),
    so_can: 240,
    so_ho_so_da_nop: 57,
    tinh_trang: 'DANG_MO',
    cong_bo: true,
    mo_ta: 'Nhận hồ sơ đăng ký mua, thuê mua nhà ở xã hội tại dự án NOXH Sông Hồng Residence.',
    nhom: [GROUPS.thuNhapThap, GROUPS.canBo, GROUPS.coCong],
  },
  {
    id: 'dot-garden',
    ...sunshine,
    da_project_id: 'p-garden',
    ten: 'NOXH Sunshine Garden — Đợt 1',
    ten_du_an: 'NOXH Sunshine Garden',
    dia_chi_du_an: 'Phường Phú Thượng, quận Tây Hồ, Hà Nội',
    anh_url: null,
    tu_ngay: rel(-60 * DAY),
    den_ngay: rel(-30 * DAY),
    so_can: 150,
    so_ho_so_da_nop: 412,
    tinh_trang: 'DA_DONG',
    cong_bo: true,
    mo_ta: null,
    nhom: [GROUPS.congNhan, GROUPS.thuNhapThap],
  },
  {
    id: 'dot-riverside',
    ...sunshine,
    da_project_id: 'p-riverside',
    ten: 'NOXH Riverside — Đợt 1',
    ten_du_an: 'NOXH Riverside',
    dia_chi_du_an: 'Phường Thạnh Mỹ Lợi, TP. Thủ Đức, TP. Hồ Chí Minh',
    anh_url: null,
    tu_ngay: rel(-120 * DAY),
    den_ngay: rel(-90 * DAY),
    so_can: 200,
    so_ho_so_da_nop: 530,
    tinh_trang: 'DA_DONG',
    cong_bo: true,
    mo_ta: null,
    nhom: [GROUPS.congNhan, GROUPS.canBo],
  },
  {
    id: 'dot-old',
    ...sunshine,
    da_project_id: 'p-old',
    ten: 'NOXH Phú Lãm — Đợt 1',
    ten_du_an: 'NOXH Phú Lãm',
    dia_chi_du_an: 'Phường Phú Lãm, quận Hà Đông, Hà Nội',
    anh_url: null,
    tu_ngay: rel(-200 * DAY),
    den_ngay: rel(-170 * DAY),
    so_can: 90,
    so_ho_so_da_nop: 260,
    tinh_trang: 'DA_DONG',
    cong_bo: true,
    mo_ta: null,
    nhom: [GROUPS.thuNhapThap],
  },
  {
    id: 'dot-bluesky-tower',
    ...bluesky,
    da_project_id: 'p-bluesky-tower',
    ten: 'NOXH BlueSky Tower — Đợt 1',
    ten_du_an: 'NOXH BlueSky Tower',
    dia_chi_du_an: 'Phường Định Công, quận Hoàng Mai, Hà Nội',
    anh_url: null,
    tu_ngay: rel(-150 * DAY),
    den_ngay: rel(-120 * DAY),
    so_can: 120,
    so_ho_so_da_nop: 300,
    tinh_trang: 'DA_DONG',
    cong_bo: true,
    mo_ta: null,
    nhom: [GROUPS.canBo, GROUPS.coCong],
  },
];

/* ---------------- Giấy tờ ---------------- */

/** 8 giấy tờ cơ bản của nhóm mặc định (Luật Nhà ở 2023) — `bat_buoc` theo seed. */
const DOC_TEMPLATE: { key: string; ten: string; bat_buoc: boolean; co_mau?: boolean }[] = [
  { key: 'don', ten: 'Đơn đăng ký mua nhà ở xã hội', bat_buoc: true, co_mau: true },
  { key: 'cccd', ten: 'Bản sao Căn cước công dân', bat_buoc: true },
  { key: 'nha-o', ten: 'Giấy xác nhận thực trạng nhà ở', bat_buoc: true },
  { key: 'thu-nhap', ten: 'Giấy xác nhận thu nhập', bat_buoc: true },
  { key: 'doi-tuong', ten: 'Giấy tờ chứng minh đối tượng', bat_buoc: true },
  { key: 'uu-tien', ten: 'Giấy xác nhận đối tượng ưu tiên', bat_buoc: false },
  { key: 'cu-tru', ten: 'Giấy xác nhận cư trú', bat_buoc: true },
  { key: 'khac', ten: 'Hồ sơ khác', bat_buoc: false },
];

/** Bộ giấy tờ mới (chưa nộp) cho hồ sơ `hoSoId`. */
export function newDocs(hoSoId: string, hanNop: string | null): NoxhDoc[] {
  return DOC_TEMPLATE.map((t) => ({
    id: `${hoSoId}-${t.key}`,
    ten: t.ten,
    bat_buoc: t.bat_buoc,
    dinh_dang: ['pdf', 'jpg', 'png'],
    dung_luong_mb: 5,
    co_mau: !!t.co_mau,
    tep_ten: null,
    tep_kich_thuoc: null,
    ngay_nop: null,
    trang_thai: 'CHUA_CUNG_CAP',
    ly_do: null,
    han_nop: hanNop,
  }));
}

/** Bộ giấy tờ đã nộp đủ, đều được chấm `DAT` (trừ `overrides`). */
function filledDocs(hoSoId: string, nopLuc: string, overrides: Record<string, Partial<NoxhDoc>> = {}): NoxhDoc[] {
  return newDocs(hoSoId, null).map((d) => {
    const key = d.id.slice(hoSoId.length + 1);
    const base: NoxhDoc = d.bat_buoc
      ? { ...d, tep_ten: `${key}.pdf`, tep_kich_thuoc: 820_000, ngay_nop: nopLuc, trang_thai: 'DAT' }
      : d;
    return { ...base, ...overrides[key] };
  });
}

/* ---------------- Khách ---------------- */

const addr = (dia_chi: string, ma_xa: string, ten_xa: string, ma_tinh: string, ten_tinh: string) => ({ dia_chi, ma_xa, ten_xa, ma_tinh, ten_tinh });

/** Thông tin khách theo SĐT (bản thật: `kh_snapshot` / `cloud_customers`). */
export const mockNoxhCustomers: Record<string, NoxhCustomerSnapshot> = {
  '0901234567': {
    ma_so_kh: 'KH-000128',
    ten_kh: 'Nguyễn Văn An',
    ngay_sinh: '1990-05-12',
    gioi_tinh: 'Nam',
    cccd: '079090001234',
    ngay_cap: '2021-04-10',
    noi_cap: 'Cục Cảnh sát QLHC về TTXH',
    di_dong: '0901234567',
    email: 'demo@beesky.vn',
    anh_url: '',
    thuong_tru: addr('125 Nguyễn Hữu Thọ', '79-27094', 'Phường Tân Hưng', '79', 'TP. Hồ Chí Minh'),
    hien_tai_giong_thuong_tru: true,
    hien_tai: addr('125 Nguyễn Hữu Thọ', '79-27094', 'Phường Tân Hưng', '79', 'TP. Hồ Chí Minh'),
  },
  '0938111222': {
    ma_so_kh: 'KH-000377',
    ten_kh: 'Lê Thu Hà',
    ngay_sinh: '1996-11-03',
    gioi_tinh: 'Nữ',
    cccd: '001099012345',
    ngay_cap: '2022-01-15',
    noi_cap: 'Cục Cảnh sát QLHC về TTXH',
    di_dong: '0938111222',
    email: 'thuha.le@email.com',
    anh_url: '',
    thuong_tru: addr('18 ngõ 102 Trường Chinh', '01-00352', 'Phường Phương Mai', '01', 'Hà Nội'),
    hien_tai_giong_thuong_tru: true,
    hien_tai: addr('18 ngõ 102 Trường Chinh', '01-00352', 'Phường Phương Mai', '01', 'Hà Nội'),
  },
};

/**
 * CCCD trên tài khoản cổng / hồ sơ khách theo `công ty:SĐT` (`cloud_portal_accounts.cccd`, `cloud_customers.cccd`).
 * Demo ở BlueSky chưa có CCCD → đăng ký hồ sơ ở đợt C phải cập nhật CCCD trước.
 */
export const mockAccountCccd: Record<string, string | null> = {
  [`${MOCK_COMPANIES.sunshine.companyId}:0901234567`]: '079090001234',
  [`${MOCK_COMPANIES.bluesky.companyId}:0901234567`]: null,
  [`${MOCK_COMPANIES.sunshine.companyId}:0938111222`]: '001099012345',
};
export const mockCustomerCccd: Record<string, string | null> = { ...mockAccountCccd };

/* ---------------- Hồ sơ ---------------- */

export interface MockApplication extends Omit<NoxhApplicationDetail, 'quyen' | 'boc_tham'> {
  /** SĐT chủ hồ sơ (bản thật: máy chủ xác định khách theo token phiên). */
  owner: string;
  /** Thời điểm chuyển sang Cần bổ sung — tệp tải sau mốc này vẫn thay được. */
  supplement_since: string | null;
}

const demo = mockNoxhCustomers['0901234567'];
const ha = mockNoxhCustomers['0938111222'];

export const mockApplications: MockApplication[] = [
  {
    id: 'hs-001',
    owner: '0901234567',
    company_id: sunshine.company_id,
    so_ho_so: 'NOXH-2026-000041',
    trang_thai: 'CAN_BO_SUNG',
    nguon: 'PORTAL',
    da_project_id: 'p-garden',
    ten_du_an: 'NOXH Sunshine Garden',
    dot_id: 'dot-garden',
    dot: null,
    nhom_doi_tuong_id: GROUPS.thuNhapThap.id,
    ten_nhom: GROUPS.thuNhapThap.ten,
    loai_can_id: 'lc-2pn',
    ten_loai_can: '2 phòng ngủ (60 m²)',
    ngay_tiep_nhan: rel(-40 * DAY).slice(0, 10),
    created_at: rel(-42 * DAY),
    updated_at: rel(-2 * DAY),
    kh_snapshot: demo,
    giay_to: filledDocs('hs-001', rel(-40 * DAY), {
      cccd: { trang_thai: 'CHUA_DAT', ly_do: 'Ảnh chụp mờ, không đọc được số CCCD. Vui lòng chụp lại rõ nét cả 2 mặt.', han_nop: rel(5 * DAY).slice(0, 10) },
      'thu-nhap': { trang_thai: 'CHUA_DAT', ly_do: 'Giấy xác nhận thu nhập thiếu dấu xác nhận của cơ quan, đơn vị.', han_nop: rel(-1 * DAY).slice(0, 10) },
    }),
    lich_su: [
      { thoi_diem: rel(-40 * DAY), tu_trang_thai: null, den_trang_thai: 'MOI_TIEP_NHAN', ly_do: null },
      { thoi_diem: rel(-30 * DAY), tu_trang_thai: 'MOI_TIEP_NHAN', den_trang_thai: 'DANG_THAM_DINH', ly_do: null },
      { thoi_diem: rel(-2 * DAY), tu_trang_thai: 'DANG_THAM_DINH', den_trang_thai: 'CAN_BO_SUNG', ly_do: 'Bổ sung 2 giấy tờ chưa đạt yêu cầu (CCCD, xác nhận thu nhập).' },
    ],
    supplement_since: rel(-2 * DAY),
  },
  {
    id: 'hs-002',
    owner: '0901234567',
    company_id: sunshine.company_id,
    so_ho_so: 'NOXH-2026-000017',
    trang_thai: 'SXD_CHAP_THUAN',
    nguon: 'PORTAL',
    da_project_id: 'p-riverside',
    ten_du_an: 'NOXH Riverside',
    dot_id: 'dot-riverside',
    dot: null,
    nhom_doi_tuong_id: GROUPS.congNhan.id,
    ten_nhom: GROUPS.congNhan.ten,
    loai_can_id: 'lc-2pn',
    ten_loai_can: '2 phòng ngủ (60 m²)',
    ngay_tiep_nhan: rel(-110 * DAY).slice(0, 10),
    created_at: rel(-112 * DAY),
    updated_at: rel(-6 * DAY),
    kh_snapshot: demo,
    giay_to: filledDocs('hs-002', rel(-110 * DAY)),
    lich_su: [
      { thoi_diem: rel(-110 * DAY), tu_trang_thai: null, den_trang_thai: 'MOI_TIEP_NHAN', ly_do: null },
      { thoi_diem: rel(-100 * DAY), tu_trang_thai: 'MOI_TIEP_NHAN', den_trang_thai: 'DANG_THAM_DINH', ly_do: null },
      { thoi_diem: rel(-80 * DAY), tu_trang_thai: 'DANG_THAM_DINH', den_trang_thai: 'DU_DIEU_KIEN', ly_do: null },
      { thoi_diem: rel(-60 * DAY), tu_trang_thai: 'DU_DIEU_KIEN', den_trang_thai: 'DA_GUI_SXD', ly_do: null },
      { thoi_diem: rel(-6 * DAY), tu_trang_thai: 'DA_GUI_SXD', den_trang_thai: 'SXD_CHAP_THUAN', ly_do: null },
    ],
    supplement_since: null,
  },
  {
    id: 'hs-003',
    owner: '0901234567',
    company_id: sunshine.company_id,
    so_ho_so: 'NOXH-2025-000388',
    trang_thai: 'KHONG_DAT',
    nguon: 'PORTAL',
    da_project_id: 'p-old',
    ten_du_an: 'NOXH Phú Lãm',
    dot_id: 'dot-old',
    dot: null,
    nhom_doi_tuong_id: GROUPS.thuNhapThap.id,
    ten_nhom: GROUPS.thuNhapThap.ten,
    loai_can_id: 'lc-1pn',
    ten_loai_can: '1 phòng ngủ (45 m²)',
    ngay_tiep_nhan: rel(-190 * DAY).slice(0, 10),
    created_at: rel(-191 * DAY),
    updated_at: rel(-150 * DAY),
    kh_snapshot: demo,
    giay_to: filledDocs('hs-003', rel(-190 * DAY)),
    lich_su: [
      { thoi_diem: rel(-190 * DAY), tu_trang_thai: null, den_trang_thai: 'MOI_TIEP_NHAN', ly_do: null },
      { thoi_diem: rel(-180 * DAY), tu_trang_thai: 'MOI_TIEP_NHAN', den_trang_thai: 'DANG_THAM_DINH', ly_do: null },
      { thoi_diem: rel(-150 * DAY), tu_trang_thai: 'DANG_THAM_DINH', den_trang_thai: 'KHONG_DAT', ly_do: 'Người đăng ký đã có nhà ở thuộc sở hữu tại địa phương (theo xác nhận của UBND phường).' },
    ],
    supplement_since: null,
  },
  {
    id: 'hs-004',
    owner: '0901234567',
    company_id: bluesky.company_id,
    so_ho_so: 'NOXH-2026-000214',
    trang_thai: 'SXD_CHAP_THUAN',
    nguon: 'PORTAL',
    da_project_id: 'p-bluesky-tower',
    ten_du_an: 'NOXH BlueSky Tower',
    dot_id: 'dot-bluesky-tower',
    dot: null,
    nhom_doi_tuong_id: GROUPS.canBo.id,
    ten_nhom: GROUPS.canBo.ten,
    loai_can_id: 'lc-2pn-plus',
    ten_loai_can: '2 phòng ngủ + (70 m²)',
    ngay_tiep_nhan: rel(-140 * DAY).slice(0, 10),
    created_at: rel(-141 * DAY),
    updated_at: rel(-10 * DAY),
    kh_snapshot: { ...demo, ma_so_kh: 'BS-000207' },
    giay_to: filledDocs('hs-004', rel(-140 * DAY)),
    lich_su: [
      { thoi_diem: rel(-140 * DAY), tu_trang_thai: null, den_trang_thai: 'MOI_TIEP_NHAN', ly_do: null },
      { thoi_diem: rel(-90 * DAY), tu_trang_thai: 'DANG_THAM_DINH', den_trang_thai: 'DU_DIEU_KIEN', ly_do: null },
      { thoi_diem: rel(-10 * DAY), tu_trang_thai: 'DA_GUI_SXD', den_trang_thai: 'SXD_CHAP_THUAN', ly_do: null },
    ],
    supplement_since: null,
  },
  {
    id: 'hs-101',
    owner: '0938111222',
    company_id: sunshine.company_id,
    so_ho_so: 'NOXH-2026-000133',
    trang_thai: 'MOI_TIEP_NHAN',
    nguon: 'PORTAL',
    da_project_id: 'p-halong',
    ten_du_an: 'NOXH Hạ Long Bay',
    dot_id: 'dot-a',
    dot: null,
    nhom_doi_tuong_id: GROUPS.congNhan.id,
    ten_nhom: GROUPS.congNhan.ten,
    loai_can_id: 'lc-1pn',
    ten_loai_can: '1 phòng ngủ (45 m²)',
    ngay_tiep_nhan: rel(-1 * DAY).slice(0, 10),
    created_at: rel(-2 * DAY),
    updated_at: rel(-1 * DAY),
    kh_snapshot: ha,
    giay_to: filledDocs('hs-101', rel(-1 * DAY)).map((d) => (d.tep_ten ? { ...d, trang_thai: 'CHO_THAM_DINH' as const } : d)),
    lich_su: [{ thoi_diem: rel(-1 * DAY), tu_trang_thai: null, den_trang_thai: 'MOI_TIEP_NHAN', ly_do: null }],
    supplement_since: null,
  },
];

/* ---------------- Bốc thăm ---------------- */

export interface MockLottery extends Omit<NoxhLotteryItem, keyof NoxhSpinResult | 'da_quay'> {
  ho_so_id: string;
  /** Kết quả đã định lúc mở đợt (máy chủ: seed bí mật + dãy số giám sát) — lượt quay chỉ "mở" kết quả này. */
  ket_qua_dinh_san: Omit<NoxhSpinResult, 'mo_luc'>;
  mo_luc: string | null;
}

export const mockLotteries: MockLottery[] = [
  {
    bt_ho_so_id: 'bt-hs002',
    bt_id: 'bt-riverside-1',
    ho_so_id: 'hs-002',
    company_id: sunshine.company_id,
    so_ho_so: 'NOXH-2026-000017',
    ma_dot: 'BT-2026-004',
    ten: 'Bốc thăm NOXH Riverside — Đợt 1',
    mo_ta: 'Bốc thăm chọn căn cho hồ sơ đã được Sở Xây dựng chấp thuận.',
    ten_du_an: 'NOXH Riverside',
    tu_ngay: rel(-10 * MIN),
    den_ngay: rel(2 * 60 * MIN),
    trang_thai: 'DANG_MO',
    thu_tu_phien: 2,
    ten_nhom: GROUPS.congNhan.ten,
    ten_loai_can: '2 phòng ngủ (60 m²)',
    hash_ho_so: '5f2b9c0d4e8a1f73c6b2a9e04d1f8c3b7a6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c',
    hash_can: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    hash_bi_mat: 'c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2',
    ket_qua_dinh_san: {
      ket_qua: 'TRUNG',
      can: { ky_hieu: 'A-1205', toa: 'A', tang: '12', so_can: '05', dien_tich: 62.5, so_pn: 2, ten_loai: '2 phòng ngủ (60 m²)' },
      thu_tu_du_phong: null,
    },
    mo_luc: null,
  },
  {
    bt_ho_so_id: 'bt-hs004',
    bt_id: 'bt-bluesky-1',
    ho_so_id: 'hs-004',
    company_id: bluesky.company_id,
    so_ho_so: 'NOXH-2026-000214',
    ma_dot: 'BT-2026-007',
    ten: 'Bốc thăm NOXH BlueSky Tower — Đợt 1',
    mo_ta: null,
    ten_du_an: 'NOXH BlueSky Tower',
    tu_ngay: rel(2 * DAY),
    den_ngay: rel(2 * DAY + 2 * 60 * MIN),
    trang_thai: 'DA_KHOA',
    thu_tu_phien: 1,
    ten_nhom: GROUPS.canBo.ten,
    ten_loai_can: '2 phòng ngủ + (70 m²)',
    hash_ho_so: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    hash_can: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    hash_bi_mat: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    ket_qua_dinh_san: { ket_qua: 'CHUA_TRUNG', can: null, thu_tu_du_phong: 4 },
    mo_luc: null,
  },
];

/** Kết quả đợt đã công bố — 45 hồ sơ, 30 trúng, 3 phiên (không có họ tên/CCCD). */
export const mockPublished: NoxhPublishedLottery[] = [
  {
    bt_id: 'bt-garden-1',
    company_id: sunshine.company_id,
    ma_dot: 'BT-2026-002',
    ten: 'Bốc thăm NOXH Sunshine Garden — Đợt 1',
    ten_du_an: 'NOXH Sunshine Garden',
    tong_ho_so: 45,
    so_trung: 30,
    so_phien: 3,
    rows: (() => {
      let won = 0;
      let reserve = 0;
      return Array.from({ length: 45 }, (_, i) => {
        const win = i % 3 !== 2;
        const n = win ? won++ : reserve++;
        return {
          so_ho_so: `NOXH-2026-${String(200 + i * 7).padStart(6, '0')}`,
          thu_tu_phien: (i % 3) + 1,
          ket_qua: win ? ('TRUNG' as const) : ('CHUA_TRUNG' as const),
          // 30 căn khác nhau: tầng 3–10, mỗi tầng 4 căn.
          ky_hieu: win ? `B-${String(Math.floor(n / 4) + 3).padStart(2, '0')}${String((n % 4) + 1).padStart(2, '0')}` : null,
          thu_tu_du_phong: win ? null : n + 1,
        };
      });
    })(),
  },
];

/* ---------------- Thông báo ---------------- */

export interface MockNoxhNotification extends NoxhNotification {
  owner: string;
}

export const mockNoxhNotifications: MockNoxhNotification[] = [
  {
    id: 'tb-001',
    owner: '0901234567',
    company_id: bluesky.company_id,
    loai: 'LICH_BOC_THAM',
    tieu_de: 'Lịch bốc thăm NOXH BlueSky Tower',
    noi_dung: 'Hồ sơ NOXH-2026-000214 bốc thăm trong khung giờ đã thông báo. Vui lòng vào ứng dụng đúng giờ để tự bốc thăm.',
    link: 'boc-tham/bt-hs004',
    da_doc_luc: null,
    created_at: rel(-1 * DAY),
  },
  {
    id: 'tb-002',
    owner: '0901234567',
    company_id: sunshine.company_id,
    loai: 'HUY_BOC_THAM',
    tieu_de: 'Huỷ đợt bốc thăm NOXH Riverside (lần 1)',
    noi_dung: 'Đợt bốc thăm đã được huỷ. Lý do: điều chỉnh danh sách căn theo văn bản mới của Sở Xây dựng.',
    link: 'boc-tham',
    da_doc_luc: rel(-8 * DAY),
    created_at: rel(-9 * DAY),
  },
];
