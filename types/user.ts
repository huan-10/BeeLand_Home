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
  /** Công ty (chủ đầu tư) của hồ sơ khách hàng đang đăng nhập. */
  companyName?: string;
}

/** Một công ty có tài khoản trùng SĐT — dùng khi chọn / chuyển công ty. */
export interface CompanyOption {
  companyId: string;
  companyName: string;
  customerName: string;
  customerCode?: string;
}

/** Phiên đăng nhập ở một công ty (một SĐT có thể là khách của nhiều công ty). */
export interface CompanySession {
  companyId: string;
  companyName: string;
  /** Token phiên hợp đồng (`fn_portal_login`); vắng = tài khoản chỉ dùng được website NOXH (tự đăng ký qua website). */
  token?: string;
  /** Tài khoản cổng khách hàng (`cloud_portal_accounts.id`). */
  userId: string;
  /** Hồ sơ khách hàng (`cloud_customers.id`) ở công ty này. */
  customerId: string;
  user: User;
  /**
   * Phiên website Nhà ở xã hội (`mau4`) của công ty này — lấy bằng `fn_portal_site_login(slug…)` với CÙNG tài khoản/mật khẩu.
   * Hàm `fn_portal_noxh_*` chỉ nhận token này; token hợp đồng ở trên không gọi được hàm NOXH (và ngược lại).
   */
  noxh?: NoxhLink;
  /** Slug website NOXH của công ty (biết lúc đăng nhập) — còn lại khi token NOXH hết hạn để nhắc kết nối lại. */
  noxhSite?: string;
}

/** Token phiên NOXH của một công ty. */
export interface NoxhLink {
  /** Slug website `mau4` của chủ đầu tư. */
  slug: string;
  token: string;
}

export interface AuthSession {
  /** Token hợp đồng của công ty đang xem (vắng khi công ty đó chỉ có token NOXH). */
  token?: string;
  userId: string;
  /** Thời điểm tạo phiên, chuỗi ISO 8601. */
  createdAt: string;
  /** Công ty (uuid `ma_ctdk`) của tài khoản cổng khách hàng đang dùng. */
  companyId?: string;
  /** Hồ sơ khách hàng (`cloud_customers.id`) — MỌI dữ liệu chỉ lấy theo khách này. */
  customerId?: string;
  /** Hồ sơ khách hàng lúc đăng nhập — hiển thị ngay khi mở lại app. */
  user?: User;
  /** SĐT đăng nhập (đã chuẩn hoá) — dùng để dò hồ sơ phát sinh ở công ty mới. */
  phone?: string;
  /** Phiên của mọi công ty có SĐT này (đăng nhập một lần, chuyển công ty không cần nhập lại mật khẩu). */
  companies?: CompanySession[];
}
