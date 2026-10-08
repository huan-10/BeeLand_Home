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

/** Một hồ sơ khách hàng (ở một công ty) trùng SĐT — dùng khi chọn / chuyển hồ sơ. */
export interface CompanyOption {
  companyId: string;
  companyName: string;
  /** Hồ sơ `cloud_customers.id` (một công ty có thể có nhiều hồ sơ cùng SĐT, chung 1 tài khoản). */
  customerId?: string;
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
  /** Hồ sơ khách hàng (`cloud_customers.id`) đang xem ở công ty này. */
  customerId: string;
  /** Hồ sơ gắn với tài khoản (`cloud_portal_accounts.khach_hang_id`) — vắng = `customerId` (phiên cũ / chưa đổi hồ sơ). */
  accountCustomerId?: string;
  /** Tên đăng nhập của tài khoản (`username`, có thể khác SĐT nếu nhân viên đặt) — dùng khi kết nối NOXH. */
  loginName?: string;
  user: User;
  /**
   * Mọi hồ sơ cùng SĐT ở công ty này (`fn_portal_app_ho_so_list`, chung 1 tài khoản) — khách chọn hồ sơ đang xem.
   * Vắng (phiên cũ / chỉ NOXH / server chưa có hàm) = chỉ hồ sơ `customerId`.
   */
  profiles?: CustomerProfile[];
  /**
   * Phiên website Nhà ở xã hội (`mau4`) của công ty này — lấy bằng `fn_portal_site_login(slug…)` với CÙNG tài khoản/mật khẩu.
   * Hàm `fn_portal_noxh_*` chỉ nhận token này; token hợp đồng ở trên không gọi được hàm NOXH (và ngược lại).
   */
  noxh?: NoxhLink;
  /** Slug website NOXH của công ty (biết lúc đăng nhập) — còn lại khi token NOXH hết hạn để nhắc kết nối lại. */
  noxhSite?: string;
}

/** Một hồ sơ khách hàng trong công ty. */
export interface CustomerProfile {
  customerId: string;
  user: User;
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
