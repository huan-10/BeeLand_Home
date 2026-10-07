/**
 * Yêu cầu khách hàng — bảng `cloud_customer_requests` (web "Tiếp nhận yêu cầu"), khách gửi / xem qua
 * `fn_portal_request_options` · `fn_portal_request_create` · `fn_portal_my_requests` (token phiên cổng khách hàng).
 */
export interface CustomerRequestLog {
  content: string;
  status: string | null;
  date: string;
}

export interface CustomerRequest {
  id: string;
  /** Số phiếu, ví dụ YC261006-0001. */
  code: string;
  title: string;
  content: string;
  category: string | null;
  status: string;
  /** Màu trạng thái do chủ đầu tư đặt trên web (green / blue / orange / red / magenta…). */
  statusColor: string | null;
  /** Số phiếu hợp đồng / giữ chỗ gắn kèm. */
  contract: string | null;
  createdAt: string;
  updatedAt: string | null;
  /** Đường dẫn tệp trong kho riêng tư (mở qua `portal-request-files`). */
  attachments: string[];
  /** Mới nhất trước. */
  history: CustomerRequestLog[];
}

export interface RequestOption {
  id: string;
  name: string;
}

export interface RequestOptions {
  categories: RequestOption[];
  /** Hợp đồng / phiếu giữ chỗ của chính khách ("Số phiếu · Mã căn · Dự án"). */
  contracts: RequestOption[];
}
