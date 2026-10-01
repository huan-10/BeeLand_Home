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
  amount: number;
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

/** Kết quả khởi tạo thanh toán. */
export interface PaymentIntent {
  status: 'redirect' | 'unavailable';
  /** URL cổng thanh toán khi `status = redirect`. */
  checkoutUrl?: string;
  message: string;
}
