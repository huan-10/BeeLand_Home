export type InstallmentStatus = 'paid' | 'partial' | 'upcoming' | 'overdue' | 'scheduled';

/** Đợt thanh toán như lưu trong cơ sở dữ liệu. */
export interface PaymentInstallment {
  id: string;
  contractId: string;
  /** Thứ tự đợt, bắt đầu từ 1. */
  sequence: number;
  name: string;
  description?: string;
  /** Tỷ lệ phần trăm trên giá trị hợp đồng. */
  percentOfContract: number;
  /** Tổng phải thu của đợt (đã gồm `maintenanceFee`). */
  amount: number;
  /** Phí bảo trì thu cùng đợt (web: "Phải thu PBT"); phần còn lại của `amount` là tiền căn hộ. */
  maintenanceFee?: number;
  paidAmount: number;
  /** Hạn thanh toán, ISO yyyy-MM-dd. */
  dueDate: string;
  /** Ngày thanh toán đủ, ISO yyyy-MM-dd. */
  paidDate?: string;
}

/** Đợt thanh toán kèm các giá trị suy diễn (trạng thái, số ngày còn lại...). */
export interface PaymentInstallmentView extends PaymentInstallment {
  status: InstallmentStatus;
  remainingAmount: number;
  /** Số ngày còn lại tới hạn (âm nếu đã quá hạn). */
  daysUntilDue: number;
  contractCode: string;
  projectName: string;
  unitCode: string;
}

export type InstallmentFilter = 'all' | 'due' | 'paid';

/**
 * Loại khoản thanh toán QR (tài khoản định danh — module VA như web):
 * HOPDONG = một đợt của HĐMB/HĐGV · DATCOC = tiền cọc phiếu chờ duyệt · BOOKING = tiền giữ chỗ phiếu chờ duyệt.
 */
export type PaymentModule = 'HOPDONG' | 'DATCOC' | 'BOOKING';

/** Khoản khách có thể thanh toán ngay trên một hợp đồng (số tiền ước tính; máy chủ tính lại khi tạo mã QR). */
export interface PayTarget {
  contractId: string;
  module: PaymentModule;
  /** Số đợt (HOPDONG); đặt cọc / giữ chỗ → null. */
  dot: number | null;
  /** "Đợt 1", "Tiền đặt cọc", "Tiền giữ chỗ". */
  name: string;
  amount: number;
  /** Hạn thanh toán của đợt, yyyy-MM-dd. */
  dueDate?: string;
  /** Số ngày tới hạn (âm = quá hạn). */
  daysUntilDue?: number;
  /** Hạn giữ chỗ (BOOKING), ISO đầy đủ giờ. */
  expiresAt?: string;
  contractCode: string;
  unitCode: string;
  projectName: string;
}

/** Mã QR chuyển khoản vào tài khoản định danh do máy chủ cấp (edge `portal-payment`). */
export interface PaymentCheckout {
  vaId: string;
  module: PaymentModule;
  /** Mã ngân hàng cho VietQR (vd "BIDV"). */
  bankCode: string;
  accountNumber: string;
  accountName: string;
  /** Số tiền cần chuyển (máy chủ tính). */
  amount: number;
  /** Nội dung chuyển khoản. */
  content: string;
  /** Hạn của tài khoản (chỉ giữ chỗ), ISO. */
  expiresAt: string | null;
  /** Số tiền tài khoản đã nhận lúc mở mã — tăng lên nghĩa là vừa nhận được tiền. */
  paidAmount: number;
  label: string;
  contractCode: string;
}

/** Trạng thái tài khoản định danh (hỏi lại mỗi vài giây). */
export interface PaymentCheckStatus {
  paidAmount: number;
  /** Tài khoản còn hoạt động (booking quá hạn → máy chủ xoá). */
  active: boolean;
  /** Booking / đặt cọc đã được tự duyệt sau khi nhận tiền. */
  approved: boolean;
}
