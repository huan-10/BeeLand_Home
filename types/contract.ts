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
  /** Ảnh đại diện dự án (URL từ backend). Không có → giao diện dùng ảnh minh họa mặc định. */
  projectImageUrl?: string;
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

/** Số lượng hợp đồng theo nhóm tab lọc. */
export interface ContractCounts {
  all: number;
  active: number;
  completed: number;
}

export interface ContractFilter {
  status?: ContractStatus | 'all';
  type?: ContractType | 'all';
  /** Tìm theo số hợp đồng, mã căn hoặc tên dự án. */
  search?: string;
}

/** Bên bán (chủ đầu tư / đơn vị phân phối). */
export interface ContractParty {
  companyName: string;
  representative: string;
  position: string;
  taxCode: string;
  address: string;
  hotline: string;
  email: string;
}

/** Điều khoản chính hiển thị ở tab "Thông tin khác". */
export interface ContractTerm {
  title: string;
  content: string;
}

/** Tệp hợp đồng (PDF). `url` có thể là đường dẫn http(s) hoặc file cục bộ. */
export interface ContractDocument {
  title: string;
  url: string;
}
