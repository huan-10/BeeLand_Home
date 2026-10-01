export interface User {
  id: string;
  /** Mã khách hàng nội bộ, ví dụ KH-000123. */
  customerCode: string;
  fullName: string;
  email: string;
  phone: string;
  /** Số CCCD/CMND. */
  idNumber: string;
  address: string;
  avatarUrl?: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  /** Thời điểm tạo phiên, chuỗi ISO 8601. */
  createdAt: string;
}
