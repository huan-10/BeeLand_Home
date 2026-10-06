/**
 * Nhà ở xã hội (NOXH) — kiểu dữ liệu khớp JSON của `fn_portal_noxh_*` (web `beeland`:
 * `src/pages/CustomerPortal/noxh/types.ts`, `src/pages/sales/nha-o-xa-hoi/shared/types.ts`).
 * Giữ nguyên tên trường snake_case của server để nối API thật không phải ánh xạ.
 * Trường `company_id` / `slug` / `ten_chu_dau_tu` do app thêm khi gộp dữ liệu nhiều chủ đầu tư.
 */

export type NoxhStatus =
  | 'NHAP'
  | 'MOI_TIEP_NHAN'
  | 'DANG_THAM_DINH'
  | 'CAN_BO_SUNG'
  | 'DU_DIEU_KIEN'
  | 'DA_GUI_SXD'
  | 'SXD_CHAP_THUAN'
  | 'KHONG_DAT'
  | 'RUT_HO_SO';

export type NoxhDocStatus = 'CHUA_CUNG_CAP' | 'CHO_THAM_DINH' | 'DAT' | 'CHUA_DAT';
export type NoxhFormat = 'pdf' | 'doc' | 'docx' | 'jpg' | 'png' | 'xls' | 'xlsx';
export type NoxhRoundStatus = 'CHUA_CONG_BO' | 'SAP_MO' | 'DANG_MO' | 'DA_DONG';
export type NoxhSource = 'NOI_BO' | 'PORTAL';
export type NoxhGender = 'Nam' | 'Nữ' | 'Khác' | '';

/* ---------------- Đợt nhận hồ sơ ---------------- */

/** fn_portal_noxh_dot_list */
export interface NoxhRound {
  id: string;
  company_id: string;
  slug: string;
  ten_chu_dau_tu: string;
  ten: string;
  ten_du_an: string | null;
  dia_chi_du_an: string | null;
  anh_url: string | null;
  tu_ngay: string;
  den_ngay: string;
  so_can: number | null;
  so_ho_so_da_nop: number;
  tinh_trang: NoxhRoundStatus;
}

export interface NoxhRoundGroup {
  id: string;
  ten: string;
  mo_ta: string | null;
}

/** fn_portal_noxh_dot_get */
export interface NoxhRoundDetail extends NoxhRound {
  mo_ta: string | null;
  /** Máy chủ không trả (chỉ dữ liệu giả dùng). */
  da_project_id?: string;
  nhom: NoxhRoundGroup[];
}

/** fn_portal_noxh_loai_can */
export interface NoxhLoaiCan {
  id: string;
  ten: string;
}

/* ---------------- Tài khoản NOXH ---------------- */

/** fn_portal_noxh_tai_khoan — CCCD / SĐT che giữa; `co_cccd` = tài khoản đã có CCCD (bắt buộc để nộp hồ sơ online). */
export interface NoxhAccountInfo {
  cccd: string | null;
  di_dong: string | null;
  co_cccd: boolean;
}

/* ---------------- Hồ sơ ---------------- */

export interface NoxhAddress {
  dia_chi: string;
  ma_xa: string;
  ten_xa: string;
  ma_tinh: string;
  ten_tinh: string;
}

/** Bản chụp thông tin khách lúc nộp hồ sơ (`kh_snapshot`). */
export interface NoxhCustomerSnapshot {
  ma_so_kh: string;
  ten_kh: string;
  ngay_sinh: string | null;
  gioi_tinh: NoxhGender;
  cccd: string;
  ngay_cap: string | null;
  noi_cap: string;
  di_dong: string;
  email: string;
  anh_url: string;
  thuong_tru: NoxhAddress;
  hien_tai_giong_thuong_tru: boolean;
  hien_tai: NoxhAddress;
}

/** fn_portal_noxh_ho_so_list */
export interface NoxhApplicationRow {
  id: string;
  company_id: string;
  so_ho_so: string;
  trang_thai: NoxhStatus;
  ten_du_an: string | null;
  ten_dot: string | null;
  ten_nhom: string | null;
  ngay_tiep_nhan: string;
  updated_at: string;
  so_giay_to: number;
  so_da_nop: number;
  so_dat: number;
  so_can_bo_sung: number;
}

/** Giấy tờ trong `giay_to[]` — không có `tep_url` (tải qua edge function). */
export interface NoxhDoc {
  id: string;
  ten: string;
  bat_buoc: boolean;
  dinh_dang: NoxhFormat[];
  dung_luong_mb: number;
  co_mau: boolean;
  tep_ten: string | null;
  tep_kich_thuoc: number | null;
  ngay_nop: string | null;
  trang_thai: NoxhDocStatus;
  ly_do: string | null;
  han_nop: string | null;
}

/** Dòng lịch sử — không có tên nhân viên. */
export interface NoxhHistoryItem {
  thoi_diem: string;
  tu_trang_thai: NoxhStatus | null;
  den_trang_thai: NoxhStatus;
  ly_do: string | null;
}

/** Quyền của khách trên hồ sơ — máy chủ trả, client chỉ bật/tắt nút theo đó. */
export interface NoxhQuyen {
  sua_thong_tin: boolean;
  /** Id các giấy tờ khách được tải/bỏ tệp. */
  sua_giay_to: string[];
  nop: boolean;
  gui_bo_sung: boolean;
  xoa: boolean;
}

/** `boc_tham` của fn_portal_noxh_ho_so_get — tu_ngay/den_ngay = khung giờ hiệu lực; kết quả chỉ có khi `da_quay`. */
export interface NoxhApplicationLottery {
  bt_ho_so_id: string;
  ma_dot: string;
  ten: string;
  tu_ngay: string;
  den_ngay: string;
  trang_thai: NoxhLotteryStatus;
  server_now: string;
  da_quay: boolean;
  ket_qua?: NoxhLotteryOutcome;
  can?: { ky_hieu: string } | null;
  thu_tu_du_phong?: number | null;
}

/** fn_portal_noxh_ho_so_get */
export interface NoxhApplicationDetail {
  id: string;
  company_id: string;
  so_ho_so: string;
  trang_thai: NoxhStatus;
  nguon: NoxhSource;
  da_project_id: string;
  ten_du_an: string | null;
  dot_id: string | null;
  dot: { id: string; ten: string; tu_ngay: string; den_ngay: string; tinh_trang: NoxhRoundStatus } | null;
  nhom_doi_tuong_id: string;
  ten_nhom: string | null;
  loai_can_id?: string | null;
  ten_loai_can?: string | null;
  ngay_tiep_nhan: string;
  created_at: string;
  updated_at: string;
  kh_snapshot: NoxhCustomerSnapshot;
  giay_to: NoxhDoc[];
  lich_su: NoxhHistoryItem[];
  quyen: NoxhQuyen;
  boc_tham?: NoxhApplicationLottery | null;
}

/** p_payload của fn_portal_noxh_ho_so_save (máy chủ bỏ mọi trường khác, ép CCCD/SĐT theo tài khoản). */
export interface NoxhSavePayload {
  id?: string;
  dot_id: string;
  nhom_doi_tuong_id: string;
  /** Vắng khoá = giữ giá trị cũ, null = xoá. */
  loai_can_id?: string | null;
  khach_hang: Partial<Omit<NoxhCustomerSnapshot, 'ma_so_kh' | 'thuong_tru' | 'hien_tai'>> & {
    thuong_tru?: Partial<NoxhAddress>;
    hien_tai?: Partial<NoxhAddress>;
  };
}

export interface NoxhSaveResult {
  id: string;
  so_ho_so: string;
  trang_thai: NoxhStatus;
}

/* ---------------- Bốc thăm ---------------- */

/** Trạng thái đợt khách nhìn thấy (NHAP / HUY không trả ra). */
export type NoxhLotteryStatus = 'DA_KHOA' | 'DANG_MO' | 'DA_CONG_BO';
export type NoxhLotteryOutcome = 'TRUNG' | 'CHUA_TRUNG';

export interface NoxhLotteryUnit {
  ky_hieu: string;
  toa: string | null;
  tang: string | null;
  so_can: string | null;
  dien_tich: number | null;
  so_pn: number | null;
  ten_loai: string | null;
}

/** fn_portal_noxh_boc_tham_quay.data — cũng gộp vào lượt khi `da_quay`. */
export interface NoxhSpinResult {
  ket_qua: NoxhLotteryOutcome;
  can: NoxhLotteryUnit | null;
  thu_tu_du_phong: number | null;
  mo_luc: string;
}

/** fn_portal_noxh_boc_tham_cua_toi.items[] — tu_ngay/den_ngay = khung giờ hiệu lực. */
export interface NoxhLotteryItem extends Partial<NoxhSpinResult> {
  bt_ho_so_id: string;
  bt_id: string;
  company_id: string;
  so_ho_so: string;
  ma_dot: string;
  ten: string;
  mo_ta: string | null;
  ten_du_an: string | null;
  tu_ngay: string;
  den_ngay: string;
  trang_thai: NoxhLotteryStatus;
  thu_tu_phien: number;
  ten_nhom: string | null;
  ten_loai_can: string | null;
  hash_ho_so: string | null;
  hash_can: string | null;
  hash_bi_mat: string | null;
  da_quay: boolean;
}

/** fn_portal_noxh_boc_tham_cua_toi — `server_now` để bù lệch đồng hồ. */
export interface NoxhLotteryMine {
  server_now: string;
  items: NoxhLotteryItem[];
}

export interface NoxhPublishedRow {
  so_ho_so: string;
  thu_tu_phien: number;
  ket_qua: NoxhLotteryOutcome;
  ky_hieu: string | null;
  thu_tu_du_phong: number | null;
}

/**
 * fn_portal_noxh_boc_tham_cong_bo — một đợt đã công bố (không có họ tên/CCCD).
 * Danh sách (`p_da_project_id = null`) không kèm kết quả; `rows` chỉ có sau khi tải kết quả của đợt (`getPublishedResult`).
 */
export interface NoxhPublishedLottery {
  bt_id: string;
  company_id: string;
  ma_dot: string;
  ten: string;
  ten_du_an: string | null;
  tong_ho_so: number;
  so_trung: number;
  so_phien: number;
  rows?: NoxhPublishedRow[];
}

/* ---------------- Thông báo ---------------- */

export type NoxhNotificationType = 'LICH_BOC_THAM' | 'KET_QUA_BOC_THAM' | 'HUY_BOC_THAM';

/** fn_portal_noxh_thong_bao.items[] */
export interface NoxhNotification {
  id: string;
  company_id: string;
  loai: NoxhNotificationType;
  tieu_de: string;
  noi_dung: string | null;
  /** Đường dẫn tương đối trong portal (vd. `boc-tham/<id>`). */
  link: string | null;
  da_doc_luc: string | null;
  created_at: string;
}
