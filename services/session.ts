import { sessionCompanies } from '@/lib/companySession';
import type { AuthSession, NoxhLink } from '@/types';

import { ServiceError } from './errors';

export interface CustomerScope {
  /** `cloud_customers.id` của khách đang đăng nhập. */
  customerId: string;
  /** `ma_ctdk` (uuid công ty) của tài khoản. */
  companyId: string;
  /** Tài khoản cổng khách hàng (`cloud_portal_accounts.id`). */
  accountId: string;
}

/** Công ty trong phiên (tên + slug website NOXH nếu đã biết) — nguồn đợt nhận hồ sơ. */
export interface SessionCompany {
  companyId: string;
  companyName: string;
  noxhSite?: string;
}

/** Token NOXH kèm công ty — hồ sơ / bốc thăm / thông báo NOXH gộp từ mọi công ty có token này. */
export interface CompanyNoxhLink extends NoxhLink {
  companyId: string;
  companyName: string;
}

let active: CustomerScope | null = null;
let noxhLinks: CompanyNoxhLink[] = [];
let companyIds: string[] = [];
let companyInfo: SessionCompany[] = [];
let noxhOnly = false;
const listeners = new Set<() => void>();
const noxhExpiredListeners = new Set<(companyId: string) => void>();

/** AuthContext gọi khi đăng nhập / khôi phục phiên / đăng xuất. */
export function setActiveSession(session: AuthSession | null): void {
  active =
    session?.customerId && session.companyId
      ? { customerId: session.customerId, companyId: session.companyId, accountId: session.userId }
      : null;
  // Công ty đang xem chỉ có token NOXH (tài khoản tự đăng ký qua website) → không có hợp đồng để tải.
  noxhOnly = !!session && !session.token;
  const companies = session ? sessionCompanies(session) : [];
  companyIds = companies.map((c) => c.companyId);
  companyInfo = companies.map((c) => ({ companyId: c.companyId, companyName: c.companyName, noxhSite: c.noxh?.slug ?? c.noxhSite }));
  noxhLinks = companies.flatMap((c) => (c.noxh ? [{ ...c.noxh, companyId: c.companyId, companyName: c.companyName }] : []));
  listeners.forEach((l) => l());
}

/**
 * Công ty đang xem không có phiên hợp đồng (chỉ có phiên NOXH) → hợp đồng / thanh toán / phiếu thu trả rỗng,
 * không gọi server. Màn rỗng giải thích "Khi trúng bốc thăm và ký hợp đồng…".
 */
export function isNoxhOnlySession(): boolean {
  return noxhOnly;
}

/** Công ty khách đã có tài khoản (đợt nhận hồ sơ chỉ lấy từ các công ty này — spec §3.3). */
export function getSessionCompanyIds(): string[] {
  return companyIds;
}

export function getSessionCompanies(): SessionCompany[] {
  return companyInfo;
}

/** Token NOXH của các công ty đã kết nối. */
export function getNoxhLinks(): CompanyNoxhLink[] {
  return noxhLinks;
}

/** Đã có token NOXH (ở một công ty cụ thể, hoặc ở bất kỳ công ty nào). */
export function hasNoxhLink(companyId?: string): boolean {
  return companyId ? noxhLinks.some((l) => l.companyId === companyId) : noxhLinks.length > 0;
}

/** AuthContext nghe để bỏ token NOXH đã hết hạn của một công ty (không đăng xuất cả app). */
export function onNoxhSessionExpired(listener: (companyId: string) => void): () => void {
  noxhExpiredListeners.add(listener);
  return () => noxhExpiredListeners.delete(listener);
}

export function emitNoxhSessionExpired(companyId: string): void {
  noxhExpiredListeners.forEach((l) => l(companyId));
}

/** Phạm vi dữ liệu của khách đang đăng nhập. Không có phiên → lỗi, KHÔNG BAO GIỜ trả dữ liệu không lọc. */
export function requireCustomerScope(): CustomerScope {
  if (!active) throw new ServiceError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'UNAUTHORIZED');
  return active;
}

/** Đăng ký nhận báo khi đổi phiên (để xoá bộ nhớ đệm dữ liệu của khách cũ). */
export function onSessionChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
