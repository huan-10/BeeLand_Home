import type { PaymentInstallmentView } from './payment';

/** HDMB: hợp đồng mua bán · HDDC: hợp đồng đặt cọc · PGC: phiếu giữ chỗ. */
export type ContractType = 'purchase' | 'deposit' | 'reservation';

export type ContractStatus = 'active' | 'completed' | 'pending' | 'cancelled';

export interface Contract {
  id: string;
  /** Số hợp đồng, ví dụ HDMB/2026/001. */
  code: string;
  type: ContractType;
  status: ContractStatus;
  customerId: string;
  projectName: string;
  /** Mã căn, ví dụ A-1203. */
  unitCode: string;
  block: string;
  floor: number;
  /** Diện tích thông thủy (m²). */
  area: number;
  /** Tổng giá trị hợp đồng (VNĐ). */
  totalValue: number;
  /** Ngày ký, chuỗi ISO yyyy-MM-dd. */
  signedDate: string;
  salesAgent?: string;
}

/** Tổng hợp tình hình thanh toán của một hợp đồng (tính từ các đợt thanh toán). */
export interface ContractPaymentSummary {
  totalValue: number;
  paidAmount: number;
  remainingAmount: number;
  /** 0 – 100. */
  paidPercent: number;
  installmentCount: number;
  paidInstallmentCount: number;
  overdueCount: number;
  nextInstallment: PaymentInstallmentView | null;
}

export interface ContractListItem extends Contract {
  summary: ContractPaymentSummary;
}

export interface ContractFilter {
  status?: ContractStatus | 'all';
  type?: ContractType | 'all';
  /** Tìm theo số hợp đồng, mã căn hoặc tên dự án. */
  search?: string;
}
