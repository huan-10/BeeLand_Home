export type PaymentMethod = 'bank_transfer' | 'cash' | 'card';

export interface Receipt {
  id: string;
  /** Số phiếu thu, ví dụ PT2026-0015. */
  code: string;
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
}
