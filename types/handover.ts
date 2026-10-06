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

/** Trạng thái lịch bàn giao (`bee_handover_schedules.trang_thai` lưu chữ). */
export type HandoverScheduleStatus = 'pending' | 'confirmed' | 'done' | 'postponed';

/** Một buổi bàn giao — "Lịch bàn giao" trên web (`bee_handover_schedules`). */
export interface HandoverSchedule {
  id: string;
  contractCode: string;
  unitCode: string;
  projectName: string;
  /** Ngày bàn giao theo giờ Việt Nam (yyyy-MM-dd). */
  date: string;
  /** Ví dụ "08:00 - 10:00". */
  timeSlot: string;
  /** Ví dụ "Bàn giao thô", "Bàn giao hoàn thiện". */
  method: string;
  staff: string;
  status: HandoverScheduleStatus;
  /** Nhãn gốc trên server (hiển thị khi khác bộ nhãn chuẩn). */
  statusLabel: string;
  note: string;
}

export interface HandoverScheduleList {
  items: HandoverSchedule[];
  /** Hotline chủ đầu tư để khách liên hệ đổi lịch (có thể trống). */
  hotline: string;
}
