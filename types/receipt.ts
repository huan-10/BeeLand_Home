export type PaymentMethod = 'bank_transfer' | 'cash' | 'card';

/** paid: đã thu và xác nhận · pending: đã ghi nhận, chờ kế toán xác nhận · cancelled: phiếu đã hủy. */
export type ReceiptStatus = 'paid' | 'pending' | 'cancelled';

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
}

export interface ReceiptFilter {
  contractId?: string;
  /** Năm phát hành phiếu thu. */
  year?: number;
  status?: ReceiptStatus;
}
