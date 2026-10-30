import { MOCK_NOXH_SITES } from '@/data/mock/noxh';
import { DEMO_CREDENTIALS, MOCK_OTP, mockCustomerRecords, mockNoxhOnlyUsers, mockUsers } from '@/data/mock/user';
import { addCompanies, missingFromSession, planCompanyLogins, sessionCompanies, sessionTokens, type CompanyLoginPlan } from '@/lib/companySession';
import type { OtpPurpose } from '@/lib/appOtp';
import { ACCOUNT_NOT_FOUND, WRONG_PASSWORD, loginRejectMessage, normalizePhone, parseLoginId } from '@/lib/validation';
import type { AuthSession, CompanyOption, CompanySession, CustomerProfile, User } from '@/types';

import { AUTH_BACKEND } from './config';
import { ServiceError } from './errors';
import { clone, simulateLatency } from './mockLatency';
import { mockNoxhToken } from './noxhService';
import { str } from './supabase/client';
import {
  appSignIn,
  chooseProfile,
  deleteAppAccount,
  findNewCompaniesByToken,
  getNoxhSites,
  listMyContracts,
  listMyProfiles,
  noxhSessionAlive,
  portalLogin,
  portalLogout,
  sendAppOtp,
  siteLogin,
  verifyAppOtp,
  type AppSignInCompany,
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

async function mockStartPasswordReset(phone: string): Promise<RegistrationStart> {
  await simulateLatency();
  if (!mockAccounts.some((a) => samePhone(a.phone, phone))) {
    throw new ServiceError('Số điện thoại chưa đăng ký tài khoản.', 'NOT_FOUND', 'phone');
  }
  const requestId = `otp-reset-${Date.now()}`;
  mockOtpRequests.set(requestId, { phone: normalizePhone(phone), createdAt: Date.now(), attempts: 0 });
  return { requestId, phone: normalizePhone(phone), otpLength: MOCK_OTP.length, resendIn: 60 };
}

async function mockConfirmPasswordReset(requestId: string, otp: string, password: string): Promise<void> {
  await simulateLatency();
  const req = mockOtpRequests.get(requestId);
  if (!req) throw new ServiceError('Phiên xác nhận không hợp lệ. Vui lòng gửi lại mã.', 'UNKNOWN', 'otp');
  if (otp !== MOCK_OTP) throw new ServiceError('Mã OTP không đúng.', 'UNAUTHORIZED', 'otp');
  mockOtpRequests.delete(requestId);
  for (const a of mockAccounts) if (samePhone(a.phone, req.phone)) a.password = password;
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
  const owned = mockAccounts.filter((a) => (id.kind === 'phone' ? samePhone(a.phone, id.value) : digits(a.idNumber) === id.value));
  if (owned.length === 0) throw new ServiceError(ACCOUNT_NOT_FOUND, 'NOT_FOUND', 'identifier');
  const matched = owned.filter((a) => a.password === password);
  if (matched.length === 0) throw new ServiceError(WRONG_PASSWORD, 'UNAUTHORIZED', 'password');
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

/** OTP thật (`fn_portal_app_otp_gui` / `_xac_minh`): server tìm hồ sơ theo SĐT, gửi mã qua ZNS → SMS và tự kiểm mã. */
async function apiStartOtp(phone: string, purpose: OtpPurpose): Promise<RegistrationStart> {
  const otp = await sendAppOtp(normalizePhone(phone), purpose);
  return { requestId: otp.otpId, phone: normalizePhone(phone), otpLength: otp.length, resendIn: otp.resendIn };
}

async function apiConfirmOtp(requestId: string, otp: string, password: string): Promise<void> {
  await verifyAppOtp(requestId, otp.trim(), password);
}

/**
 * Mọi hồ sơ cùng SĐT ở công ty của phiên (`fn_portal_app_ho_so_list`) — chung 1 tài khoản, khách chọn hồ sơ đang xem.
 * Lỗi (server chưa có hàm, mạng…) → `undefined`: chỉ dùng hồ sơ của tài khoản, đăng nhập không bị chặn.
 */
async function profilesFor(
  row: PortalLoginRow,
  companyName: string | undefined,
): Promise<(CustomerProfile[] & { activeId: string | null }) | undefined> {
  try {
    const { rows, activeId } = await listMyProfiles(row.session_token);
    if (rows.length === 0) return undefined;
    return Object.assign(
      rows.map((c) => ({ customerId: c.id, user: userFromCustomer(c, row, companyName) })),
      { activeId },
    );
  } catch {
    // Không có danh sách (migration chưa áp, mạng…) → giữ hồ sơ của tài khoản; lần đăng nhập sau thử lại.
    return undefined;
  }
}

/** Kết quả `fn_portal_app_dang_nhap` → phiên từng công ty (+ danh sách hồ sơ); công ty có phiên hợp đồng đứng trước. */
async function toCompanySessions(companies: AppSignInCompany[]): Promise<CompanySession[]> {
  const sessions = await Promise.all(
    companies.map(async (c): Promise<CompanySession> => {
      const companyName = str(c.ten_ct);
      const row: PortalLoginRow = {
        session_token: c.token ?? c.noxh_token ?? '',
        account_id: c.account_id,
        khach_hang_id: c.khach_hang_id,
        ma_ctdk: c.company_id,
        username: c.username,
        email: null,
        ten_kh: null,
        di_dong: null,
        ma_so_kh: null,
      };
      const profiles = c.token ? await profilesFor(row, companyName) : undefined;
      const active = profiles?.find((p) => p.customerId === profiles.activeId);
      return {
        companyId: c.company_id,
        companyName,
        userId: c.account_id,
        customerId: active?.customerId ?? c.khach_hang_id,
        accountCustomerId: c.khach_hang_id,
        user: active?.user ?? userFromCustomer(c.khach_hang, row, companyName),
        ...(profiles && profiles.length > 1 ? { profiles: profiles.map(({ customerId, user }) => ({ customerId, user })) } : {}),
        ...(c.username ? { loginName: c.username } : {}),
        ...(c.token ? { token: c.token } : {}),
        ...(c.noxh_slug ? { noxhSite: c.noxh_slug } : {}),
        ...(c.noxh_slug && c.noxh_token ? { noxh: { slug: c.noxh_slug, token: c.noxh_token } } : {}),
      };
    }),
  );
  return [...sessions.filter((c) => c.token), ...sessions.filter((c) => !c.token)];
}

async function apiLogin(identifier: string, password: string): Promise<LoginResult> {
  if (!parseLoginId(identifier)) throw new ServiceError('Nhập số điện thoại 10 số hoặc CCCD 12 số', 'UNKNOWN', 'identifier');
  const { phone, companies } = await appSignIn(identifier.trim(), password);
  return buildSession(phone, await toCompanySessions(companies));
}

async function apiFindNewCompanies(session: AuthSession): Promise<CompanyOption[]> {
  const companies = sessionCompanies(session);
  const token = session.token ?? companies.find((c) => c.token)?.token;
  if (!token) return [];
  return findNewCompaniesByToken(token, companies.map((c) => c.companyId));
}

/** Liên kết công ty mới: đăng nhập lại trên server bằng SĐT của phiên + mật khẩu khách vừa nhập; chỉ giữ công ty mới. */
async function apiLinkNewCompanies(session: AuthSession, password: string): Promise<LinkResult> {
  const phone = sessionPhone(session);
  if (!phone) throw new ServiceError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'UNAUTHORIZED');
  // Kiểm mật khẩu ở công ty đang xem trước (1 lượt sai nếu gõ nhầm) — rồi mới đăng nhập lại mọi công ty trên server.
  const active = sessionCompanies(session).find((c) => c.companyId === session.companyId);
  if (session.companyId) {
    let check: PortalLoginRow;
    try {
      check = await portalLogin(session.companyId, active?.loginName || phone, password);
    } catch (e) {
      if (e instanceof ServiceError && e.code === 'NETWORK') throw e;
      throw new ServiceError(loginRejectMessage([e instanceof Error ? e.message : '']), 'UNAUTHORIZED', 'password');
    }
    // Phiên vừa tạo chỉ để kiểm tra mật khẩu → huỷ ngay.
    void portalLogout(check.session_token).catch(() => undefined);
  }
  let result: Awaited<ReturnType<typeof appSignIn>>;
  try {
    result = await appSignIn(phone, password);
  } catch (e) {
    if (e instanceof ServiceError && e.code === 'NETWORK') throw e;
    throw new ServiceError(e instanceof ServiceError && e.field === 'password' ? e.message : 'Chưa liên kết được công ty mới. Vui lòng thử lại sau.', 'UNAUTHORIZED', 'password');
  }
  const known = new Set(sessionCompanies(session).map((c) => c.companyId));
  // Phiên vừa tạo ở công ty đã có trong phiên là thừa → huỷ ngay.
  const extra = result.companies.filter((c) => known.has(c.company_id)).flatMap((c) => [c.token, c.noxh_token]);
  extra.forEach((t) => t && void portalLogout(t).catch(() => undefined));
  const entries = await toCompanySessions(result.companies.filter((c) => !known.has(c.company_id)));
  if (entries.length === 0) throw new ServiceError('Chưa liên kết được công ty mới. Vui lòng thử lại sau.', 'UNKNOWN');
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
 * Đăng ký bước 1: SĐT phải có trong hồ sơ khách hàng (mọi công ty) và chưa có tài khoản — server kiểm, gửi OTP 6 số qua Zalo (ZNS → SMS).
 * `requestId` = id mã (`otp_id`).
 */
export async function startRegistration(phone: string): Promise<RegistrationStart> {
  return AUTH_BACKEND === 'mock' ? mockStartRegistration(phone) : apiStartOtp(phone, 'DANG_KY');
}

/** Đăng ký bước 2: server kiểm OTP rồi tạo tài khoản (mọi công ty có hồ sơ chưa có tài khoản) với mật khẩu đã nhập ở bước 1. */
export async function confirmRegistration(requestId: string, otp: string, password: string): Promise<void> {
  return AUTH_BACKEND === 'mock' ? mockConfirmRegistration(requestId, otp, password) : apiConfirmOtp(requestId, otp, password);
}

/** Quên mật khẩu bước 1: SĐT phải đã đăng ký tài khoản (server báo rõ nếu chưa), gửi OTP qua Zalo. */
export async function startPasswordReset(phone: string): Promise<RegistrationStart> {
  return AUTH_BACKEND === 'mock' ? mockStartPasswordReset(phone) : apiStartOtp(phone, 'QUEN_MK');
}

/** Quên mật khẩu bước 2: đúng OTP → đặt mật khẩu mới cho tài khoản ở mọi công ty có SĐT này, mở khoá và huỷ phiên cũ. */
export async function confirmPasswordReset(requestId: string, otp: string, password: string): Promise<void> {
  return AUTH_BACKEND === 'mock' ? mockConfirmPasswordReset(requestId, otp, password) : apiConfirmOtp(requestId, otp, password);
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
  // Website NOXH lưu trong phiên lúc đăng nhập; phiên cũ chưa có thì tra (tạm, bỏ ở giai đoạn 2).
  const sites: Record<string, string> = Object.fromEntries(companies.flatMap((c) => (c.noxhSite ? [[c.companyId, c.noxhSite]] : [])));
  const unknown = companies.filter((c) => !c.noxhSite).map((c) => c.companyId);
  if (unknown.length > 0) Object.assign(sites, (await getNoxhSites(unknown)).byCompany);
  const phone = sessionPhone(session);
  // Chỉ thử các công ty có website NOXH mà chưa có token; kết quả tính trên đúng các công ty này.
  const attempted = companies.filter((c) => !c.noxh && sites[c.companyId]);
  if (attempted.length === 0 && !companies.some((c) => c.noxh)) throw new ServiceError('Chủ đầu tư của bạn chưa mở cổng Nhà ở xã hội.', 'NOT_FOUND');
  let connected = 0;
  const next = await Promise.all(
    companies.map(async (c) => {
      const slug = sites[c.companyId];
      if (c.noxh || !slug) return slug ? { ...c, noxhSite: slug } : c;
      try {
        const row = await siteLogin(slug, c.loginName || phone, password);
        connected += 1;
        return { ...c, noxh: { slug, token: row.session_token }, noxhSite: slug };
      } catch (e) {
        if (e instanceof ServiceError && e.code === 'NETWORK') throw e;
        return { ...c, noxhSite: slug };
      }
    }),
  );
  if (attempted.length > 0 && connected === 0) {
    // Phiên lưu trước 2026-10-08 chưa có tên đăng nhập (username nhân viên đặt có thể khác SĐT) → đăng nhập lại để lấy.
    const legacy = attempted.some((c) => !c.loginName);
    throw new ServiceError(
      legacy ? 'Mật khẩu không đúng. Nếu chắc chắn mật khẩu đúng, vui lòng đăng xuất rồi đăng nhập lại.' : 'Mật khẩu không đúng.',
      'UNAUTHORIZED',
      'password',
    );
  }
  return { ...session, companies: next };
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

/**
 * Chọn hồ sơ đang xem ở một công ty: đặt cho phiên server (`fn_portal_app_chon_ho_so`) để yêu cầu / thanh toán online theo
 * cùng hồ sơ. Gọi TRƯỚC `withActiveCompany`. Hồ sơ đang là hồ sơ của công ty / phiên chỉ NOXH / mock → không gọi server.
 */
export async function selectProfile(session: AuthSession, companyId: string, customerId: string): Promise<void> {
  if (AUTH_BACKEND === 'mock') return;
  const entry = sessionCompanies(session).find((c) => c.companyId === companyId);
  if (!entry?.token || entry.customerId === customerId) return;
  await chooseProfile(entry.token, customerId);
}

/**
 * Xoá tài khoản (Apple 5.1.1(v)): kiểm mật khẩu hiện tại rồi xoá tài khoản đăng nhập ở mọi công ty của SĐT này.
 * Chỉ xoá tài khoản app — hồ sơ, hợp đồng, phiếu thu do chủ đầu tư quản lý vẫn giữ. Sai mật khẩu → lỗi gắn ô `password`.
 */
export async function deleteAccount(session: AuthSession, password: string): Promise<void> {
  if (AUTH_BACKEND === 'mock') {
    await simulateLatency();
    const account = mockAccounts.find((a) => a.id === session.userId);
    if (!account || account.password !== password) throw new ServiceError('Mật khẩu không đúng', 'UNAUTHORIZED', 'password');
    for (let i = mockAccounts.length - 1; i >= 0; i -= 1) if (samePhone(mockAccounts[i].phone, account.phone)) mockAccounts.splice(i, 1);
    return;
  }
  const tokens = sessionTokens(session);
  if (tokens.length === 0) throw new ServiceError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'UNAUTHORIZED');
  await deleteAppAccount(tokens, password);
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
