/**
 * Bàn giao căn hộ — "Quỹ bàn giao" trên web (`bee_handover_funds`, RPC `fn_handover_fund_list`), mỗi căn một dòng.
 * Trạng thái theo cột `state`: PENDING · NOTIFIED · HANDING_OVER · HANDED_OVER · PAUSED.
 */
export type HandoverStatus = 'pending' | 'notified' | 'handing_over' | 'handed_over' | 'paused';

export interface Handover {
  id: string;
  /** Số phiếu quỹ bàn giao, ví dụ QBG-2026-0001. */
  code: string;
  status: HandoverStatus;
  /** Id hợp đồng trong app (= phiếu giữ chỗ). */
  contractId: string;
  /** Số HĐMB. */
  contractCode: string;
  unitCode: string;
  projectName: string;
  projectImageUrl?: string;
  /** Khoảng thời gian bàn giao (ISO yyyy-MM-dd), có thể trống. */
  fromDate: string | null;
  toDate: string | null;
  /** Diện tích theo hợp đồng / thực tế bàn giao (m²). */
  areaContract: number | null;
  areaHandover: number | null;
  /** % chênh lệch diện tích (dương = tăng). */
  areaDiffPercent: number | null;
  /** % tiến độ thanh toán gốc / phí bảo trì. */
  paymentPercent: number | null;
  maintenancePercent: number | null;
  note: string;
}

/** Trạng thái lịch nhận nhà — mã máy chủ của `bg_lich_hen.trang_thai` (lịch `HUY` không trả về app). */
export type HandoverScheduleStatus = 'CHO_XAC_NHAN' | 'DA_XAC_NHAN' | 'DANG_BAN_GIAO' | 'DA_BAN_GIAO' | 'VANG_MAT' | 'HOAN';

/** Một lịch hẹn nhận nhà ("Lịch bàn giao" trên web, `bg_lich_hen`) — đọc qua `_bg_lich_khach`. */
export interface HandoverSchedule {
  id: string;
  /** Id quỹ bàn giao (= `Handover.id`). */
  fundId: string;
  unitCode: string;
  /** Lần hẹn thứ mấy của căn. */
  attempt: number;
  /** Ngày hẹn theo giờ Việt Nam (yyyy-MM-dd). */
  date: string;
  /** Ca ký (`cloud_signing_shifts`) — trống nếu lịch chưa gắn ca. */
  shiftId: string | null;
  /** Ví dụ "08:00–10:00", có thể trống. */
  timeSlot: string;
  place: string;
  status: HandoverScheduleStatus;
  statusLabel: string;
  staff: string;
  /** SĐT người phụ trách (thiếu thì hotline chủ đầu tư). */
  contact: string;
  /** Số tiền cần nộp trước buổi nhận (chỉ lịch chờ / đã xác nhận). */
  amountDue: number | null;
  /** Khách tự đăng ký trên app (chỉ lịch này khách được tự đổi / huỷ). */
  selfBooked: boolean;
  /** Biên bản bàn giao đã ký. */
  record: { code: string; date: string } | null;
}

/** Một ca nhận nhà trong ngày. */
export interface HandoverShift {
  id: string;
  name: string;
  /** hh:mm */
  from: string;
  to: string;
  capacity: number;
  remaining: number;
}

/** Ca + chỗ còn cho mọi ngày trong khoảng đăng ký (`fn_portal_app_bg_ca`). */
export interface HandoverSlots {
  from: string;
  to: string;
  days: { date: string; shifts: HandoverShift[] }[];
}

/** Khối "Lịch nhận nhà" trên thẻ căn. */
export type AppointmentKind = 'no_window' | 'can_book' | 'pending' | 'confirmed' | 'handed_over' | 'expired' | 'paused';

export interface AppointmentView {
  kind: AppointmentKind;
  /** Lịch hiệu lực (chờ / đã xác nhận / đang / đã bàn giao). */
  active: HandoverSchedule | null;
  /** Khoảng còn đăng ký được (null nếu thiếu ngày hoặc đã qua). */
  window: { from: string; to: string; daysLeft: number } | null;
  /** Lịch cũ không còn hiệu lực (vắng mặt / hoãn), mới nhất trước. */
  previous: HandoverSchedule[];
}

export interface HandoverOverviewItem extends Handover {
  appointment: AppointmentView;
}

export interface HandoverOverview {
  items: HandoverOverviewItem[];
  /** Hotline chủ đầu tư (có thể trống). */
  hotline: string;
}
