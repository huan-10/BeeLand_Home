import { MOCK_NOXH_SITES } from '@/data/mock/noxh';
import { DEMO_CREDENTIALS, MOCK_OTP, mockCustomerRecords, mockNoxhOnlyUsers, mockUsers } from '@/data/mock/user';
import { addCompanies, missingFromSession, planCompanyLogins, sessionCompanies, sessionTokens, type CompanyLoginPlan } from '@/lib/companySession';
import { normalizePhone, parseLoginId } from '@/lib/validation';
import type { AuthSession, CompanyOption, CompanySession, User } from '@/types';

import { AUTH_BACKEND } from './config';
import { ServiceError } from './errors';
import { clone, simulateLatency } from './mockLatency';
import { mockNoxhToken } from './noxhService';
import { str } from './supabase/client';
import {
  findCustomersByCccd,
  findCustomersByPhone,
  getCompanyNames,
  getNoxhSites,
  getPortalAccount,
  listMyContracts,
  noxhSessionAlive,
  portalLogin,
  portalLogout,
  setPortalPassword,
  siteLogin,
  type CustomerRow,
  type PortalLoginRow,
} from './supabase/portal';

/**
 * Đăng nhập thành công: `session.companies` là phiên ở MỌI công ty có SĐT này (đã tự liên kết hồ sơ chưa có tài khoản).
 * Phiên đang xem mặc định là công ty đầu tiên; có từ 2 công ty → giao diện hỏi chọn công ty (`withActiveCompany`).
 */
export interface LoginResult {
  session: AuthSession;
  user: User;
}

function buildSession(phone: string, companies: CompanySession[]): LoginResult {
  const first = companies[0];
  const session: AuthSession = {
    phone,
    token: first.token,
    userId: first.userId,
    createdAt: new Date().toISOString(),
    companyId: first.companyId,
    // Khách của phiên do server trả (fn_portal_login) — mọi dữ liệu sau đăng nhập chỉ lọc theo khách này.
    customerId: first.customerId,
    user: first.user,
    companies,
  };
  return { session, user: first.user };
}

/** Công ty mới vừa liên kết thêm vào phiên đang đăng nhập. */
export interface LinkResult {
  session: AuthSession;
  added: CompanyOption[];
}

const ALREADY_REGISTERED = 'Số điện thoại đã có tài khoản. Vui lòng đăng nhập — hồ sơ ở công ty mới sẽ được tự liên kết.';

/** SĐT của phiên; phiên lưu trước 2026-10-05 chưa có `phone` → lấy SĐT hồ sơ khách. */
const sessionPhone = (session: AuthSession) => session.phone || normalizePhone(session.user?.phone ?? '');

const toOption = (c: CompanySession): CompanyOption => ({
  companyId: c.companyId,
  companyName: c.companyName,
  customerName: c.user.fullName,
  customerCode: c.user.customerCode,
});

export interface RegistrationStart {
  /** Mã phiên xác nhận OTP, gửi lại ở bước 2. */
  requestId: string;
  /** SĐT đã chuẩn hoá (0xxxxxxxxx). */
  phone: string;
  otpLength: number;
  /** Số giây trước khi được gửi lại mã. */
  resendIn: number;
}

/* ------------------------------------------------------------------ mock ------------------------------------------------------------------ */

const MOCK_TOKEN_PREFIX = 'mock-token-';

type MockAccount = User & { companyId: string; password: string; /** Tự đăng ký qua website NOXH → chỉ có phiên NOXH. */ noxhOnly?: boolean };

/** Tài khoản app giả lập (cloud_portal_accounts) — chỉ lưu trong bộ nhớ. TODO: xóa khi chuyển hẳn sang API. */
const mockAccounts: MockAccount[] = [
  ...mockUsers.map((u) => ({ ...u, password: DEMO_CREDENTIALS.password })),
  ...mockNoxhOnlyUsers.map((u) => ({ ...u, password: DEMO_CREDENTIALS.password, noxhOnly: true })),
];
const mockOtpRequests = new Map<string, { phone: string; createdAt: number; attempts: number }>();

const samePhone = (a: string, b: string) => normalizePhone(a) === normalizePhone(b);
const toUser = ({ password: _password, companyId: _companyId, noxhOnly: _noxhOnly, ...user }: MockAccount): User => clone(user);
const digits = (v: string) => v.replace(/\D/g, '');

async function mockStartRegistration(phone: string): Promise<RegistrationStart> {
  await simulateLatency();
  // Hồ sơ khách hàng = khách chưa có tài khoản + khách đã có tài khoản (như bảng cloud_customers).
  const records = [...mockCustomerRecords, ...mockUsers].filter((c) => samePhone(c.phone, phone));
  if (records.length === 0) {
    throw new ServiceError(
      'Số điện thoại chưa có trong hệ thống khách hàng. Vui lòng dùng số đã đăng ký khi ký hợp đồng hoặc liên hệ chủ đầu tư.',
      'NOT_FOUND',
      'phone',
    );
  }
  // Đã có tài khoản ở một công ty → đăng nhập (tự liên kết công ty mới, cùng mật khẩu), không đăng ký lại.
  if (mockAccounts.some((a) => samePhone(a.phone, phone))) throw new ServiceError(ALREADY_REGISTERED, 'CONFLICT', 'phone');
  const requestId = `otp-${Date.now()}`;
  mockOtpRequests.set(requestId, { phone: normalizePhone(phone), createdAt: Date.now(), attempts: 0 });
  return { requestId, phone: normalizePhone(phone), otpLength: MOCK_OTP.length, resendIn: 60 };
}

async function mockConfirmRegistration(requestId: string, otp: string, password: string): Promise<void> {
  await simulateLatency();
  const req = mockOtpRequests.get(requestId);
  if (!req) throw new ServiceError('Phiên xác nhận không hợp lệ. Vui lòng gửi lại mã.', 'UNKNOWN', 'otp');
  if (Date.now() - req.createdAt > 5 * 60 * 1000) throw new ServiceError('Mã OTP đã hết hạn. Vui lòng gửi lại mã.', 'UNKNOWN', 'otp');
  if (req.attempts >= 5) throw new ServiceError('Nhập sai quá nhiều lần. Vui lòng gửi lại mã.', 'UNKNOWN', 'otp');
  if (otp !== MOCK_OTP) {
    req.attempts += 1;
    throw new ServiceError('Mã OTP không đúng.', 'UNAUTHORIZED', 'otp');
  }
  mockOtpRequests.delete(requestId);
  for (const record of mockCustomerRecords.filter((c) => samePhone(c.phone, req.phone))) {
    if (mockAccounts.some((a) => a.companyId === record.companyId && samePhone(a.phone, req.phone))) continue;
    mockAccounts.push({ ...record, id: `user-reg-${mockAccounts.length + 1}`, password });
  }
}

/** Phiên của một công ty: token hợp đồng (trừ tài khoản tự đăng ký NOXH) + token NOXH nếu công ty có website `mau4`. */
const mockCompanySession = (a: MockAccount): CompanySession => {
  const slug = MOCK_NOXH_SITES[a.companyId];
  return {
    companyId: a.companyId,
    companyName: a.companyName ?? '',
    ...(a.noxhOnly ? {} : { token: `${MOCK_TOKEN_PREFIX}${a.id}` }),
    userId: a.id,
    customerId: a.id,
    user: toUser(a),
    ...(slug ? { noxh: { slug, token: mockNoxhToken(a.companyId, normalizePhone(a.phone)) }, noxhSite: slug } : {}),
  };
};

/** Hồ sơ của SĐT ở công ty chưa có tài khoản → tạo tài khoản cùng mật khẩu (giống `linkCompanies`). */
function mockLinkRecords(phone: string, password: string, skip: Set<string>): MockAccount[] {
  const linked: MockAccount[] = [];
  for (const record of mockCustomerRecords.filter((c) => samePhone(c.phone, phone) && !skip.has(c.companyId))) {
    if (mockAccounts.some((a) => a.companyId === record.companyId && samePhone(a.phone, phone))) continue;
    const account: MockAccount = { ...record, id: `user-link-${mockAccounts.length + 1}`, password };
    mockAccounts.push(account);
    linked.push(account);
  }
  return linked;
}

async function mockLogin(identifier: string, password: string): Promise<LoginResult> {
  await simulateLatency();
  const id = parseLoginId(identifier);
  if (!id) throw new ServiceError('Nhập số điện thoại 10 số hoặc CCCD 12 số', 'UNKNOWN', 'identifier');
  const matched = mockAccounts.filter(
    (a) => (id.kind === 'phone' ? samePhone(a.phone, id.value) : digits(a.idNumber) === id.value) && a.password === password,
  );
  if (matched.length === 0) throw new ServiceError('Số điện thoại / CCCD hoặc mật khẩu không đúng', 'UNAUTHORIZED', 'password');
  const phone = normalizePhone(matched[0].phone);
  // Tự liên kết hồ sơ ở công ty chưa có tài khoản (giống apiLogin) — chỉ khi đã có tài khoản hợp đồng.
  if (matched.some((a) => !a.noxhOnly)) matched.push(...mockLinkRecords(phone, password, new Set()));
  return buildSession(phone, matched.map(mockCompanySession));
}

async function mockFindNewCompanies(session: AuthSession): Promise<CompanyOption[]> {
  await simulateLatency(150, 300);
  const phone = sessionPhone(session);
  const known = new Set(sessionCompanies(session).map((c) => c.companyId));
  const withAccount = mockAccounts.filter((a) => samePhone(a.phone, phone) && !known.has(a.companyId));
  const records = mockCustomerRecords.filter(
    (r) => samePhone(r.phone, phone) && !known.has(r.companyId) && !withAccount.some((a) => a.companyId === r.companyId),
  );
  return [...withAccount, ...records].map((c) => ({
    companyId: c.companyId,
    companyName: c.companyName ?? '',
    customerName: c.fullName,
    customerCode: c.customerCode,
  }));
}

async function mockLinkNewCompanies(session: AuthSession, password: string): Promise<LinkResult> {
  await simulateLatency();
  const active = mockAccounts.find((a) => a.id === session.userId);
  if (!active || active.password !== password) throw new ServiceError('Mật khẩu không đúng.', 'UNAUTHORIZED', 'password');
  const phone = sessionPhone(session);
  const known = new Set(sessionCompanies(session).map((c) => c.companyId));
  const existing = mockAccounts.filter((a) => samePhone(a.phone, phone) && !known.has(a.companyId) && a.password === password);
  const linked = mockLinkRecords(phone, password, known);
  const entries = [...existing, ...linked].map(mockCompanySession);
  if (entries.length === 0) throw new ServiceError('Chưa liên kết được công ty mới. Vui lòng thử lại sau.', 'UNKNOWN');
  return { session: addCompanies(session, entries), added: entries.map(toOption) };
}

/** Gắn token NOXH cho mọi công ty có website `mau4` mà phiên chưa có (mock: xác minh mật khẩu như `linkNewCompanies`). */
async function mockConnectNoxh(session: AuthSession, password: string): Promise<AuthSession> {
  await simulateLatency();
  const active = mockAccounts.find((a) => a.id === session.userId);
  if (!active || active.password !== password) throw new ServiceError('Mật khẩu không đúng.', 'UNAUTHORIZED', 'password');
  const phone = sessionPhone(session);
  const companies = sessionCompanies(session).map((c) => {
    const slug = MOCK_NOXH_SITES[c.companyId];
    return c.noxh || !slug ? c : { ...c, noxh: { slug, token: mockNoxhToken(c.companyId, phone) }, noxhSite: slug };
  });
  if (!companies.some((c) => c.noxh)) throw new ServiceError('Chủ đầu tư của bạn chưa mở cổng Nhà ở xã hội.', 'NOT_FOUND');
  return { ...session, companies };
}

/* ------------------------------------------------------------------ API (database dùng chung) ------------------------------------------------------------------ */

/**
 * TẠM THỜI: OTP cố định "8888", chưa gửi Zalo (2026-10-02, chờ template Zalo của BeeSky).
 * TODO: sinh mã ngẫu nhiên và gửi qua Zalo ZNS (FPT FNS, failover SMS) như rork-home-stay-app.
 */
const TEMP_OTP = '8888';
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

/** Phiên xác nhận OTP đang chờ: các hồ sơ khách hàng (mỗi công ty một hồ sơ) sẽ được tạo tài khoản. */
const pendingRegistrations = new Map<
  string,
  { phone: string; customers: { companyId: string; customerId: string }[]; createdAt: number; attempts: number }
>();

function userFromCustomer(c: CustomerRow | null, login: PortalLoginRow, companyName?: string): User {
  return {
    id: login.account_id,
    customerCode: str(c?.ma_so_kh ?? login.ma_so_kh),
    fullName: str(c?.ten_kh || c?.ten_cong_ty || login.ten_kh),
    email: str(c?.email ?? login.email),
    phone: str(c?.dien_thoai || c?.di_dong || login.di_dong || login.username),
    idNumber: str(c?.cccd || c?.so_cmnd),
    address: str(c?.dia_chi),
    companyName: companyName || undefined,
  };
}

async function apiStartRegistration(phone: string): Promise<RegistrationStart> {
  const customers = await findCustomersByPhone(phone);
  if (customers.length === 0) {
    throw new ServiceError(
      'Số điện thoại chưa có trong hệ thống khách hàng. Vui lòng dùng số đã đăng ký khi ký hợp đồng hoặc liên hệ chủ đầu tư.',
      'NOT_FOUND',
      'phone',
    );
  }
  const accounts = await Promise.all(customers.map((c) => getPortalAccount(c.ma_ctdk, c.id)));
  const plan = planCompanyLogins(customers, accounts, normalizePhone(phone));
  // Đã có tài khoản đang hoạt động ở một công ty → đăng nhập (tự liên kết công ty mới với CÙNG mật khẩu).
  // Không cho đăng ký lại, tránh mỗi công ty một mật khẩu khác nhau.
  if (plan.login.length > 0) throw new ServiceError(ALREADY_REGISTERED, 'CONFLICT', 'phone');
  if (plan.link.length === 0) {
    throw new ServiceError('Tài khoản của số điện thoại này đang bị khoá. Vui lòng liên hệ chủ đầu tư.', 'CONFLICT', 'phone');
  }

  const requestId = `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  pendingRegistrations.set(requestId, {
    phone: normalizePhone(phone),
    customers: plan.link,
    createdAt: Date.now(),
    attempts: 0,
  });
  return { requestId, phone: normalizePhone(phone), otpLength: TEMP_OTP.length, resendIn: 60 };
}

async function apiConfirmRegistration(requestId: string, otp: string, password: string): Promise<void> {
  const req = pendingRegistrations.get(requestId);
  if (!req) throw new ServiceError('Phiên xác nhận không hợp lệ. Vui lòng gửi lại mã.', 'UNKNOWN', 'otp');
  if (Date.now() - req.createdAt > OTP_TTL_MS) throw new ServiceError('Mã OTP đã hết hạn. Vui lòng gửi lại mã.', 'UNKNOWN', 'otp');
  if (req.attempts >= OTP_MAX_ATTEMPTS) throw new ServiceError('Nhập sai quá nhiều lần. Vui lòng gửi lại mã.', 'UNKNOWN', 'otp');
  if (otp.trim() !== TEMP_OTP) {
    req.attempts += 1;
    throw new ServiceError('Mã OTP không đúng.', 'UNAUTHORIZED', 'otp');
  }
  // Tên đăng nhập = SĐT đã chuẩn hoá (0xxxxxxxxx) cho mọi công ty, cùng một mật khẩu.
  for (const c of req.customers) {
    await setPortalPassword({ companyId: c.companyId, customerId: c.customerId, password, username: req.phone });
  }
  pendingRegistrations.delete(requestId);
}

/** Hồ sơ theo SĐT hoặc CCCD + kế hoạch đăng nhập / tự liên kết / đăng nhập website NOXH từng công ty. */
async function loadCompanyPlan(
  id: { kind: 'phone' | 'cccd'; value: string },
): Promise<{ customers: CustomerRow[]; plan: CompanyLoginPlan; phone: string; sites: Record<string, string> }> {
  // `sites` = slug website NOXH theo công ty.
  const customers = id.kind === 'phone' ? await findCustomersByPhone(id.value) : await findCustomersByCccd(id.value);
  const phone = id.kind === 'phone' ? id.value : normalizePhone(str(customers[0]?.dien_thoai || customers[0]?.di_dong));
  const [accounts, sites] = await Promise.all([
    Promise.all(customers.map((c) => getPortalAccount(c.ma_ctdk, c.id))),
    getNoxhSites([...new Set(customers.map((c) => c.ma_ctdk))]),
  ]);
  return { customers, plan: planCompanyLogins(customers, accounts, phone, sites.byCompany, sites.byConfig), phone, sites: sites.byCompany };
}

/**
 * Đăng nhập các công ty đã có tài khoản; công ty có mật khẩu khác (đăng ký riêng trước đây) thì bỏ qua.
 * `rejected`: công ty `fn_portal_login` từ chối — có thể là tài khoản tự đăng ký qua website (R21) → thử `fn_portal_site_login`.
 */
async function loginExisting(targets: CompanyLoginPlan['login'], password: string): Promise<{ rows: PortalLoginRow[]; rejected: CompanyLoginPlan['login'] }> {
  const attempts = await Promise.all(
    targets.map((t) => portalLogin(t.companyId, t.username, password).then((row) => row, (e: unknown) => e)),
  );
  const network = attempts.find((a) => a instanceof ServiceError && a.code === 'NETWORK');
  if (network) throw network;
  return {
    rows: attempts.filter((a): a is PortalLoginRow => !(a instanceof Error)),
    rejected: targets.filter((_, i) => attempts[i] instanceof Error),
  };
}

/** Tự liên kết: tạo tài khoản (cùng SĐT, cùng mật khẩu) cho hồ sơ ở công ty chưa có tài khoản, rồi đăng nhập. */
async function linkCompanies(targets: CompanyLoginPlan['link'], username: string, password: string): Promise<PortalLoginRow[]> {
  const rows: PortalLoginRow[] = [];
  for (const t of targets) {
    try {
      await setPortalPassword({ companyId: t.companyId, customerId: t.customerId, password, username });
      rows.push(await portalLogin(t.companyId, username, password));
    } catch (e) {
      // Một công ty lỗi không chặn các công ty còn lại; lần sau sẽ thử liên kết lại.
      if (__DEV__) console.log('[auth] tự liên kết công ty lỗi:', t.companyId, e);
    }
  }
  return rows;
}

/** Tài khoản tự đăng ký qua website NOXH → `fn_portal_site_login`; sai mật khẩu bỏ qua, lỗi mạng ném. */
async function loginSites(targets: CompanyLoginPlan['siteLogin'], password: string): Promise<{ row: PortalLoginRow; slug: string }[]> {
  const attempts = await Promise.all(
    targets.map((t) => siteLogin(t.slug, t.login, password).then((row) => ({ row, slug: t.slug }), (e: unknown) => e)),
  );
  const network = attempts.find((a) => a instanceof ServiceError && a.code === 'NETWORK');
  if (network) throw network;
  return attempts.filter((a): a is { row: PortalLoginRow; slug: string } => !(a instanceof Error));
}

/** Token NOXH cho công ty đã có phiên hợp đồng (cùng tài khoản, cùng mật khẩu) — lỗi thì bỏ qua (kết nối lại sau). */
async function noxhTokenFor(slug: string | undefined, login: string, password: string): Promise<CompanySession['noxh']> {
  if (!slug) return undefined;
  try {
    return { slug, token: (await siteLogin(slug, login, password)).session_token };
  } catch {
    return undefined;
  }
}

async function toCompanySessions(
  rows: PortalLoginRow[],
  customers: CustomerRow[],
  extra: { noxhOnly?: { row: PortalLoginRow; slug: string }[]; sites?: Record<string, string>; login?: string; password?: string } = {},
): Promise<CompanySession[]> {
  const siteRows = extra.noxhOnly ?? [];
  const names = await getCompanyNames([...new Set([...rows, ...siteRows.map((x) => x.row)].map((r) => r.ma_ctdk))]);
  const entry = (row: PortalLoginRow): Omit<CompanySession, 'token' | 'noxh' | 'noxhSite'> => ({
    companyId: row.ma_ctdk,
    companyName: names[row.ma_ctdk] ?? '',
    userId: row.account_id,
    customerId: row.khach_hang_id,
    user: userFromCustomer(customers.find((c) => c.id === row.khach_hang_id) ?? null, row, names[row.ma_ctdk]),
  });
  const contract = await Promise.all(
    rows.map(async (row) => ({
      ...entry(row),
      token: row.session_token,
      noxh: extra.password ? await noxhTokenFor(extra.sites?.[row.ma_ctdk], row.username || extra.login || '', extra.password) : undefined,
      noxhSite: extra.sites?.[row.ma_ctdk],
    })),
  );
  return [...contract, ...siteRows.map(({ row, slug }) => ({ ...entry(row), noxh: { slug, token: row.session_token }, noxhSite: slug }))];
}

async function apiLogin(identifier: string, password: string): Promise<LoginResult> {
  const id = parseLoginId(identifier);
  if (!id) throw new ServiceError('Nhập số điện thoại 10 số hoặc CCCD 12 số', 'UNKNOWN', 'identifier');
  const { customers, plan, phone, sites } = await loadCompanyPlan(id);
  if (plan.login.length === 0 && plan.siteLogin.length === 0) {
    throw new ServiceError('Chưa có tài khoản. Vui lòng chọn "Đăng ký" để tạo tài khoản.', 'NOT_FOUND', 'identifier');
  }
  const [{ rows, rejected }, siteRows] = await Promise.all([loginExisting(plan.login, password), loginSites(plan.siteLogin, password)]);
  // fn_portal_login từ chối mà công ty có website NOXH → có thể là tài khoản tự đăng ký (máy chủ không trả nguồn) → thử site login.
  const fallback = rejected.flatMap((t) => (sites[t.companyId] ? [{ companyId: t.companyId, customerId: t.customerId, slug: sites[t.companyId], login: t.username }] : []));
  siteRows.push(...(await loginSites(fallback, password)));
  if (rows.length === 0 && siteRows.length === 0) throw new ServiceError('Số điện thoại / CCCD hoặc mật khẩu không đúng', 'UNAUTHORIZED', 'password');
  // Mật khẩu đúng ở công ty có tài khoản hợp đồng → tự liên kết hồ sơ ở công ty chưa có tài khoản.
  if (rows.length > 0 && phone) rows.push(...(await linkCompanies(plan.link, phone, password)));
  return buildSession(phone, await toCompanySessions(rows, customers, { noxhOnly: siteRows, sites, login: phone, password }));
}

async function apiFindNewCompanies(session: AuthSession): Promise<CompanyOption[]> {
  const phone = sessionPhone(session);
  if (!phone) return [];
  const { customers, plan } = await loadCompanyPlan({ kind: 'phone', value: phone });
  const missing = missingFromSession(plan, sessionCompanies(session).map((c) => c.companyId));
  const targets = [...missing.login, ...missing.link];
  if (targets.length === 0) return [];
  const names = await getCompanyNames([...new Set(targets.map((t) => t.companyId))]);
  return targets.map((t) => {
    const c = customers.find((x) => x.id === t.customerId);
    return {
      companyId: t.companyId,
      companyName: names[t.companyId] ?? '',
      customerName: str(c?.ten_kh || c?.ten_cong_ty),
      customerCode: str(c?.ma_so_kh),
    };
  });
}

async function apiLinkNewCompanies(session: AuthSession, password: string): Promise<LinkResult> {
  const phone = sessionPhone(session);
  if (!session.companyId || !session.customerId || !phone) {
    throw new ServiceError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'UNAUTHORIZED');
  }
  // Xác minh mật khẩu bằng tài khoản của công ty đang xem (tên đăng nhập có thể khác SĐT nếu nhân viên tạo trên web).
  const current = await getPortalAccount(session.companyId, session.customerId);
  let check: PortalLoginRow;
  try {
    check = await portalLogin(session.companyId, current?.username || phone, password);
  } catch (e) {
    if (e instanceof ServiceError && e.code === 'NETWORK') throw e;
    throw new ServiceError('Mật khẩu không đúng.', 'UNAUTHORIZED', 'password');
  }
  // Phiên vừa tạo chỉ để kiểm tra mật khẩu → huỷ ngay.
  void portalLogout(check.session_token).catch(() => undefined);

  const { customers, plan, sites } = await loadCompanyPlan({ kind: 'phone', value: phone });
  const missing = missingFromSession(plan, sessionCompanies(session).map((c) => c.companyId));
  const rows = [...(await loginExisting(missing.login, password)).rows, ...(await linkCompanies(missing.link, phone, password))];
  const siteRows = await loginSites(missing.siteLogin, password);
  if (rows.length === 0 && siteRows.length === 0) throw new ServiceError('Chưa liên kết được công ty mới. Vui lòng thử lại sau.', 'UNKNOWN');
  const entries = await toCompanySessions(rows, customers, { noxhOnly: siteRows, sites, login: phone, password });
  return { session: addCompanies(session, entries), added: entries.map(toOption) };
}

/* ------------------------------------------------------------------ public ------------------------------------------------------------------ */

/**
 * Gợi ý tài khoản dùng thử hiển thị ở màn hình đăng nhập (chỉ khi chạy mock).
 * TODO: đặt thành `null` khi chuyển sang đăng nhập thật.
 */
export const demoAccountHint: { phone: string; password: string } | null =
  AUTH_BACKEND === 'mock' ? { phone: DEMO_CREDENTIALS.phone, password: DEMO_CREDENTIALS.password } : null;

/**
 * Đăng ký bước 1: SĐT phải có trong hồ sơ khách hàng (cloud_customers.dien_thoai, mọi công ty) và chưa có tài khoản;
 * hợp lệ thì gửi OTP (tạm thời: mã cố định 8888, chưa gửi Zalo).
 */
export async function startRegistration(phone: string): Promise<RegistrationStart> {
  return AUTH_BACKEND === 'mock' ? mockStartRegistration(phone) : apiStartRegistration(phone);
}

/** Đăng ký bước 2: đúng OTP thì tạo tài khoản (cloud_portal_accounts) với mật khẩu đã nhập ở bước 1. */
export async function confirmRegistration(requestId: string, otp: string, password: string): Promise<void> {
  return AUTH_BACKEND === 'mock' ? mockConfirmRegistration(requestId, otp, password) : apiConfirmRegistration(requestId, otp, password);
}

/**
 * Đăng nhập bằng số điện thoại hoặc CCCD + mật khẩu, ở mọi công ty có hồ sơ (tự liên kết hồ sơ chưa có tài khoản;
 * tài khoản tự đăng ký qua website NOXH đăng nhập bằng `fn_portal_site_login` — chỉ có phiên NOXH).
 * Lỗi gắn với ô nhập qua `ServiceError.field`.
 */
export async function login(identifier: string, password: string): Promise<LoginResult> {
  return AUTH_BACKEND === 'mock' ? mockLogin(identifier, password) : apiLogin(identifier, password);
}

/**
 * Hồ sơ của SĐT đang đăng nhập ở công ty CHƯA có trong phiên (phát sinh sau khi khách đã đăng nhập).
 * Chỉ đọc; liên kết cần mật khẩu → `linkNewCompanies`.
 */
export async function findNewCompanies(session: AuthSession): Promise<CompanyOption[]> {
  return AUTH_BACKEND === 'mock' ? mockFindNewCompanies(session) : apiFindNewCompanies(session);
}

/**
 * Liên kết công ty mới vào phiên đang đăng nhập: xác minh mật khẩu hiện tại, tạo tài khoản ở công ty mới với CÙNG mật khẩu,
 * đăng nhập và thêm vào danh sách công ty (công ty đang xem giữ nguyên).
 */
export async function linkNewCompanies(session: AuthSession, password: string): Promise<LinkResult> {
  return AUTH_BACKEND === 'mock' ? mockLinkNewCompanies(session, password) : apiLinkNewCompanies(session, password);
}

/**
 * Kết nối Nhà ở xã hội cho phiên đang đăng nhập: CÙNG tài khoản / mật khẩu, lấy thêm token website `mau4`
 * (`fn_portal_site_login`) ở mọi công ty có website NOXH. Dùng cho phiên đăng nhập trước khi có tính năng NOXH.
 */
export async function connectNoxh(session: AuthSession, password: string): Promise<AuthSession> {
  if (AUTH_BACKEND === 'mock') return mockConnectNoxh(session, password);
  const companies = sessionCompanies(session);
  const sites = (await getNoxhSites(companies.map((c) => c.companyId))).byCompany;
  const phone = sessionPhone(session);
  // Chỉ thử các công ty có website NOXH mà chưa có token; kết quả tính trên đúng các công ty này.
  const attempted = companies.filter((c) => !c.noxh && sites[c.companyId]);
  if (attempted.length === 0 && !companies.some((c) => c.noxh)) throw new ServiceError('Chủ đầu tư của bạn chưa mở cổng Nhà ở xã hội.', 'NOT_FOUND');
  let connected = 0;
  const next = await Promise.all(
    companies.map(async (c) => {
      const slug = sites[c.companyId];
      if (c.noxh || !slug) return slug ? { ...c, noxhSite: slug } : c;
      const account = await getPortalAccount(c.companyId, c.customerId).catch(() => null);
      try {
        const row = await siteLogin(slug, account?.username || phone, password);
        connected += 1;
        return { ...c, noxh: { slug, token: row.session_token }, noxhSite: slug };
      } catch (e) {
        if (e instanceof ServiceError && e.code === 'NETWORK') throw e;
        return { ...c, noxhSite: slug };
      }
    }),
  );
  if (attempted.length > 0 && connected === 0) throw new ServiceError('Mật khẩu không đúng.', 'UNAUTHORIZED', 'password');
  return { ...session, companies: next };
}

/** Gửi hướng dẫn đặt lại mật khẩu qua SMS. Không tiết lộ tài khoản có tồn tại hay không. */
export async function requestPasswordReset(_phone: string): Promise<{ channel: 'sms' }> {
  // TODO: thay bằng gọi API/database thật (ví dụ POST /auth/forgot-password)
  await simulateLatency();
  return { channel: 'sms' };
}

export interface ChangePasswordResult {
  status: 'changed' | 'unavailable';
  message: string;
}

/**
 * Đổi mật khẩu (hiện chỉ có giao diện): kiểm tra mật khẩu hiện tại trên dữ liệu mock, không lưu mật khẩu mới.
 * TODO: thay bằng gọi API/database thật (ví dụ POST /auth/change-password) và trả `status: 'changed'`.
 */
export async function changePassword(userId: string, currentPassword: string, _newPassword: string): Promise<ChangePasswordResult> {
  await simulateLatency();
  if (AUTH_BACKEND === 'mock' && mockAccounts.find((a) => a.id === userId)?.password !== currentPassword) {
    throw new ServiceError('Mật khẩu hiện tại không đúng.', 'UNAUTHORIZED', 'currentPassword');
  }
  return { status: 'unavailable', message: 'Đổi mật khẩu sẽ hoạt động khi ứng dụng kết nối hệ thống. Mật khẩu của bạn chưa thay đổi.' };
}

export async function logout(session: AuthSession | null): Promise<void> {
  if (AUTH_BACKEND === 'mock') {
    await simulateLatency(150, 300);
    return;
  }
  // Huỷ phiên ở mọi công ty; một phiên lỗi (đã hết hạn…) không chặn các phiên khác.
  if (session) await Promise.allSettled(sessionTokens(session).map((token) => portalLogout(token)));
}

/** Lấy người dùng hiện tại từ phiên đã lưu. Trả về null nếu phiên không còn hợp lệ. */
export async function getCurrentUser(session: AuthSession): Promise<User | null> {
  if (AUTH_BACKEND === 'mock') {
    await simulateLatency();
    const noxhToken = sessionCompanies(session).find((c) => c.companyId === session.companyId)?.noxh?.token;
    if (!session.token?.startsWith(MOCK_TOKEN_PREFIX) && !noxhToken?.startsWith('mock-noxh:')) return null;
    const account = mockAccounts.find((a) => a.id === session.userId);
    return account ? toUser(account) : null;
  }
  if (!session.user || !session.customerId || !session.companyId) return null;
  try {
    if (session.token) {
      // fn_portal_my_contracts báo "Phiên đăng nhập đã hết hạn…" khi token không còn hợp lệ.
      await listMyContracts(session.token);
      return session.user;
    }
    // Công ty chỉ có phiên NOXH (tài khoản tự đăng ký qua website) → kiểm bằng fn_portal_noxh_me.
    const noxhToken = sessionCompanies(session).find((c) => c.companyId === session.companyId)?.noxh?.token;
    return noxhToken && (await noxhSessionAlive(noxhToken)) ? session.user : null;
  } catch (e) {
    // Lỗi mạng → ném tiếp để không xoá phiên oan; phiên hết hạn / bị huỷ → đăng xuất.
    if (e instanceof ServiceError && e.code === 'NETWORK') throw e;
    return null;
  }
}
