export type PaymentMethod = 'bank_transfer' | 'cash' | 'card';

/** paid: đã thu và xác nhận · pending: đã ghi nhận, chờ kế toán xác nhận · cancelled: phiếu đã hủy. */
export type ReceiptStatus = 'paid' | 'pending' | 'cancelled';

/** Một phần tiền của phiếu được trừ vào một đợt (tiền căn hộ hoặc phí bảo trì). */
export interface ReceiptAllocationPart {
  /** "Đợt 2 · tiền căn hộ", "Đợt 3 · phí bảo trì". */
  label: string;
  amount: number;
}

/** Phiếu thu được trừ vào đâu (luật của fn_contract_payment_schedule) — tab Phiếu thu, mẫu C. */
export interface ReceiptAllocation {
  /** Loại phiếu thu theo danh mục: "Thu theo tiến độ", "Thu tiền lãi"… (nhiều loại → nối bằng ", "). */
  typeLabel: string;
  /** Phần trừ vào đợt (gốc / phí bảo trì). */
  parts: ReceiptAllocationPart[];
  /** Tiền lãi trong phiếu — không trừ vào hợp đồng. */
  interestAmount: number;
  /** Đợt của tiền lãi ("Đợt 1"), nếu có. */
  interestLabel?: string;
  /** Tiền gốc / PBT không trừ được vào đợt nào (thu dư, hoặc gắn đợt không có trong lịch). */
  unallocatedAmount: number;
  /** Hợp đồng đã chuyển nhượng — tiền đi theo hợp đồng mới, không phân bổ. */
  transferred: boolean;
}

export interface Receipt {
  id: string;
  /** Số phiếu thu, ví dụ PT2026-0015. */
  code: string;
  status: ReceiptStatus;
  contractId: string;
  contractCode: string;
  installmentId?: string;
  projectName: string;
  unitCode: string;
  amount: number;
  /** Ngày thu, ISO yyyy-MM-dd. */
  paidDate: string;
  method: PaymentMethod;
  payerName: string;
  content: string;
  cashier: string;
  bankReference?: string;
  /** Có khi máy chủ trả chi tiết phân bổ (fn_portal_app_phieu_thu_phan_bo); thiếu → thẻ hiển thị như cũ. */
  allocation?: ReceiptAllocation;
}

export interface ReceiptFilter {
  contractId?: string;
  /** Năm phát hành phiếu thu. */
  year?: number;
  status?: ReceiptStatus;
}
