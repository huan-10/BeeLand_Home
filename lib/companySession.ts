import type { AuthSession, CompanyOption, CompanySession } from '@/types';

/**
 * Một SĐT có thể là khách của nhiều công ty (mỗi công ty một hồ sơ `cloud_customers`).
 * Đăng nhập một lần → phiên ở mọi công ty; khách chọn / chuyển công ty đang xem.
 */

interface CustomerRef {
  id: string;
  ma_ctdk: string;
}

interface AccountRef {
  username: string | null;
  is_active: boolean;
  /** Website khách tự đăng ký (có giá trị = tài khoản đăng ký qua website NOXH `mau4`). */
  nguon_web_config_id?: string | null;
  pham_vi?: 'TAT_CA' | 'CHON' | null;
}

export interface CompanyLoginPlan {
  /** Công ty đã có tài khoản đang hoạt động → đăng nhập bằng mật khẩu khách vừa nhập. */
  login: { companyId: string; customerId: string; username: string }[];
  /** Công ty chưa có tài khoản → tự tạo tài khoản (cùng SĐT, cùng mật khẩu) rồi đăng nhập. */
  link: { companyId: string; customerId: string }[];
  /**
   * Tài khoản tự đăng ký qua website NOXH → `fn_portal_site_login(slug, login, mật khẩu)` (đường `fn_portal_login` từ chối
   * loại tài khoản này — R21). Chỉ có token NOXH (cùng tài khoản, cùng mật khẩu).
   */
  siteLogin: { companyId: string; customerId: string; slug: string; login: string }[];
}

const isSiteAccount = (a: AccountRef) => !!a.nguon_web_config_id || a.pham_vi === 'CHON';

/**
 * `accounts[i]` là tài khoản cổng của `customers[i]` (null = chưa có).
 * Mỗi công ty tối đa một phiên. Công ty có tài khoản bị khoá → bỏ qua, không tự liên kết hồ sơ khác của công ty đó.
 */
export function planCompanyLogins(
  customers: CustomerRef[],
  accounts: (AccountRef | null)[],
  phone: string,
  /** Slug website NOXH (`mau4`) theo công ty. */
  noxhSites: Record<string, string> = {},
  /** Slug theo id website (`cloud_customer_web_configs.id`) — tài khoản tự đăng ký dùng đúng website đã đăng ký. */
  siteSlugsByConfig: Record<string, string> = {},
): CompanyLoginPlan {
  const taken = new Set<string>();
  const login: CompanyLoginPlan['login'] = [];
  const siteLogin: CompanyLoginPlan['siteLogin'] = [];
  customers.forEach((c, i) => {
    const account = accounts[i];
    if (!account || taken.has(c.ma_ctdk)) return;
    taken.add(c.ma_ctdk);
    if (account.is_active === false) return;
    if (!isSiteAccount(account)) login.push({ companyId: c.ma_ctdk, customerId: c.id, username: account.username || phone });
    else {
      const slug = (account.nguon_web_config_id && siteSlugsByConfig[account.nguon_web_config_id]) || noxhSites[c.ma_ctdk];
      if (slug) siteLogin.push({ companyId: c.ma_ctdk, customerId: c.id, slug, login: account.username || phone });
    }
  });
  const link: CompanyLoginPlan['link'] = [];
  for (const c of customers) {
    if (taken.has(c.ma_ctdk)) continue;
    taken.add(c.ma_ctdk);
    link.push({ companyId: c.ma_ctdk, customerId: c.id });
  }
  return { login, link, siteLogin };
}

/** Chỉ giữ công ty chưa có trong phiên — hồ sơ phát sinh ở công ty mới sau khi khách đã đăng nhập. */
export function missingFromSession(plan: CompanyLoginPlan, knownCompanyIds: string[]): CompanyLoginPlan {
  const known = new Set(knownCompanyIds);
  return {
    login: plan.login.filter((t) => !known.has(t.companyId)),
    link: plan.link.filter((t) => !known.has(t.companyId)),
    siteLogin: plan.siteLogin.filter((t) => !known.has(t.companyId)),
  };
}

/** Phiên của từng công ty. Phiên lưu trước 2026-10-05 (chưa có `companies`) → suy ra một công ty từ phiên đang xem. */
export function sessionCompanies(session: AuthSession): CompanySession[] {
  if (session.companies) return session.companies;
  if (!session.companyId || !session.customerId || !session.user) return [];
  return [
    {
      companyId: session.companyId,
      companyName: session.user.companyName ?? '',
      token: session.token,
      userId: session.userId,
      customerId: session.customerId,
      user: session.user,
    },
  ];
}

/** Thêm phiên của công ty vừa liên kết; giữ nguyên công ty đang xem. */
export function addCompanies(session: AuthSession, entries: CompanySession[]): AuthSession {
  const current = sessionCompanies(session);
  const known = new Set(current.map((c) => c.companyId));
  return { ...session, companies: [...current, ...entries.filter((e) => !known.has(e.companyId))] };
}

/** Chuyển sang công ty khác trong cùng phiên (không cần đăng nhập lại). Không có công ty đó → giữ nguyên. */
export function withActiveCompany(session: AuthSession, companyId: string): AuthSession {
  const entry = session.companies?.find((c) => c.companyId === companyId);
  if (!entry) return session;
  return {
    ...session,
    token: entry.token,
    userId: entry.userId,
    companyId: entry.companyId,
    customerId: entry.customerId,
    user: entry.user,
  };
}

export function companyOptions(session: AuthSession | null): CompanyOption[] {
  return (session?.companies ?? []).map((c) => ({
    companyId: c.companyId,
    companyName: c.companyName,
    customerName: c.user.fullName,
    customerCode: c.user.customerCode,
  }));
}

/** Token phiên của mọi công ty (hợp đồng + NOXH) — đăng xuất phải huỷ hết. */
export function sessionTokens(session: AuthSession): string[] {
  const all = [session.token, ...(session.companies ?? []).flatMap((c) => [c.token, c.noxh?.token])];
  return [...new Set(all.filter((t): t is string => !!t))];
}

/** Công ty có website NOXH nhưng chưa có (hoặc đã mất) token NOXH → cần "Kết nối" lại bằng mật khẩu hiện tại. */
export function noxhMissing(session: AuthSession): CompanySession[] {
  return sessionCompanies(session).filter((c) => !!c.noxhSite && !c.noxh);
}
