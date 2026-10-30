import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { companyOptions, noxhMissing, sessionCompanies, withActiveCompany } from '@/lib/companySession';
import type { RememberedLogin } from '@/lib/rememberedLogin';
import { clearRememberedLogin, clearSession, loadRememberedLogin, loadSession, saveRememberedLogin, saveSession, updateSession } from '@/lib/sessionStorage';
import {
  clearAllPersonalDrafts,
  connectNoxh as connectNoxhService,
  deleteAccount as deleteAccountService,
  findNewCompanies,
  getCurrentUser,
  linkNewCompanies as linkNewCompaniesService,
  login,
  logout,
  selectProfile,
  setActiveSession,
} from '@/services';
import { unregisterPush } from '@/services/pushService';
import { onNoxhSessionExpired } from '@/services/session';
import type { AuthSession, CompanyOption, User } from '@/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  /** Các hồ sơ khách hàng (mọi công ty) có SĐT đang đăng nhập — từ 2 hồ sơ trở lên mới cho chuyển. */
  companies: CompanyOption[];
  /** Công ty đang xem. */
  activeCompanyId: string | null;
  /** Hồ sơ khách hàng đang xem (`cloud_customers.id`). */
  activeCustomerId: string | null;
  /**
   * Đăng nhập bằng số điện thoại. `remember` quyết định có lưu phiên lâu dài không.
   * SĐT là khách của nhiều công ty → trả danh sách công ty (chưa vào app); gọi `selectCompany` để vào.
   */
  signIn: (phone: string, password: string, remember: boolean) => Promise<CompanyOption[] | null>;
  /** SĐT + mật khẩu đã "Ghi nhớ đăng nhập" (Keychain; web chỉ SĐT) — màn Đăng nhập điền sẵn sau khi đăng xuất. */
  rememberedLogin: () => Promise<RememberedLogin | null>;
  /**
   * Chọn hồ sơ (công ty + hồ sơ khách hàng) sau khi đăng nhập, hoặc chuyển hồ sơ khi đang ở trong app — không cần nhập lại mật khẩu.
   * `customerId` vắng → hồ sơ đang xem của công ty đó.
   */
  selectCompany: (companyId: string, customerId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Xoá tài khoản (xác nhận bằng mật khẩu hiện tại) rồi đăng xuất, quên SĐT/mật khẩu đã ghi nhớ. Sai mật khẩu → ném lỗi, giữ phiên. */
  deleteAccount: (password: string) => Promise<void>;
  /** Hồ sơ phát sinh ở công ty mới sau khi khách đã đăng nhập — chờ khách nhập mật khẩu để liên kết. */
  newCompanies: CompanyOption[];
  /** Xác minh mật khẩu hiện tại rồi liên kết các công ty mới; trả các công ty đã thêm. */
  linkNewCompanies: (password: string) => Promise<CompanyOption[]>;
  /** "Để sau": ẩn lời nhắc tới lần dò tiếp theo (mở app / quay lại app). */
  dismissNewCompanies: () => void;
  /** Đã có token Nhà ở xã hội ở ít nhất một công ty. */
  noxhConnected: boolean;
  /** Còn công ty có website NOXH mà chưa có / đã mất token (hết hạn) → hiện thẻ "Kết nối". */
  noxhNeedsConnect: boolean;
  /** Công ty đang xem có phiên hợp đồng (false = tài khoản chỉ dùng Nhà ở xã hội, chưa có hợp đồng). */
  contractsAvailable: boolean;
  /** Nhập mật khẩu hiện tại để lấy token Nhà ở xã hội (cùng tài khoản) cho phiên đang đăng nhập. */
  connectNoxh: (password: string) => Promise<void>;
}

/** Quay lại app từ nền → dò công ty mới tối đa mỗi 30 phút một lần. */
const RECHECK_MS = 30 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  /** Đã đăng nhập nhưng chưa chọn công ty (SĐT ở nhiều công ty). */
  const pending = useRef<{ session: AuthSession; remember: boolean } | null>(null);
  const [newCompanies, setNewCompanies] = useState<CompanyOption[]>([]);
  const sessionRef = useRef<AuthSession | null>(null);
  sessionRef.current = session;
  const lastCheck = useRef(0);

  /** Dò hồ sơ ở công ty mới (chỉ đọc). Lỗi mạng… → bỏ qua, lần sau dò lại. */
  const checkNewCompanies = useCallback((current: AuthSession) => {
    lastCheck.current = Date.now();
    findNewCompanies(current)
      .then((found) => {
        if (sessionRef.current?.createdAt === current.createdAt && sessionRef.current?.userId === current.userId) setNewCompanies(found);
      })
      .catch(() => undefined);
  }, []);

  // Khôi phục phiên đã lưu khi mở ứng dụng.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadSession();
      const currentUser = stored ? await getCurrentUser(stored).catch(() => null) : null;
      if (cancelled) return;
      if (stored && currentUser) {
        setActiveSession(stored);
        setSession(stored);
        sessionRef.current = stored;
        setUser(currentUser);
        setStatus('authenticated');
        checkNewCompanies(stored);
      } else {
        if (stored) await clearSession();
        setStatus('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkNewCompanies]);

  // App chạy nền lâu ngày (phiên 7 ngày) → quay lại thì dò lại công ty mới.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const current = sessionRef.current;
      if (state === 'active' && current && Date.now() - lastCheck.current > RECHECK_MS) checkNewCompanies(current);
    });
    return () => sub.remove();
  }, [checkNewCompanies]);

  const enter = useCallback(async (next: AuthSession, remember: boolean) => {
    // Vừa đăng nhập bằng mật khẩu → đã tự liên kết mọi công ty, chưa cần dò lại.
    lastCheck.current = Date.now();
    setNewCompanies([]);
    await saveSession(next, remember);
    setActiveSession(next);
    setSession(next);
    setUser(next.user ?? null);
    setStatus('authenticated');
  }, []);

  const signIn = useCallback(
    async (phone: string, password: string, remember: boolean) => {
      // Huỷ phiên của lần đăng nhập trước mà khách chưa chọn công ty (đóng hộp thoại rồi đăng nhập lại).
      if (pending.current) void logout(pending.current.session).catch(() => undefined);
      pending.current = null;
      const result = await login(phone, password);
      // "Ghi nhớ đăng nhập": nhớ SĐT + mật khẩu (Keychain) để đăng xuất xong vẫn điền sẵn; bỏ tick → xoá.
      if (remember) void saveRememberedLogin({ identifier: phone, password });
      else void clearRememberedLogin();
      const options = companyOptions(result.session);
      if (options.length > 1) {
        pending.current = { session: result.session, remember };
        return options;
      }
      await enter(result.session, remember);
      return null;
    },
    [enter],
  );

  const selectCompany = useCallback(
    async (companyId: string, customerId?: string) => {
      if (pending.current) {
        const { session: chosen, remember } = pending.current;
        // Đặt hồ sơ cho phiên server trước (lỗi → ném, giữ hộp chọn để thử lại).
        if (customerId) await selectProfile(chosen, companyId, customerId);
        pending.current = null;
        await enter(withActiveCompany(chosen, companyId, customerId), remember);
        return;
      }
      if (!session) return;
      if (session.companyId === companyId && (!customerId || session.customerId === customerId)) return;
      if (customerId) await selectProfile(session, companyId, customerId);
      const next = withActiveCompany(session, companyId, customerId);
      await updateSession(next);
      // Đổi phiên → xoá bộ nhớ đệm dữ liệu của hồ sơ cũ (onSessionChange).
      setActiveSession(next);
      setSession(next);
      setUser(next.user ?? null);
    },
    [enter, session],
  );

  const linkNewCompanies = useCallback(
    async (password: string) => {
      if (!session) return [];
      const result = await linkNewCompaniesService(session, password);
      await updateSession(result.session);
      setSession(result.session);
      setNewCompanies([]);
      return result.added;
    },
    [session],
  );

  const dismissNewCompanies = useCallback(() => setNewCompanies([]), []);

  /** Lưu phiên đã đổi (không đổi công ty đang xem) và báo cho lớp dữ liệu. */
  const replaceSession = useCallback(async (next: AuthSession) => {
    await updateSession(next);
    setActiveSession(next);
    setSession(next);
    sessionRef.current = next;
  }, []);

  const connectNoxh = useCallback(
    async (password: string) => {
      if (!session) return;
      await replaceSession(await connectNoxhService(session, password));
    },
    [session, replaceSession],
  );

  // Phiên NOXH của một công ty hết hạn → chỉ bỏ token đó (không đăng xuất cả app); tab NOXH hiện lại thẻ "Kết nối".
  useEffect(
    () =>
      onNoxhSessionExpired((companyId) => {
        const current = sessionRef.current;
        if (!current) return;
        // Giữ slug website để vẫn biết công ty này cần kết nối lại.
        const companies = sessionCompanies(current).map((c) =>
          c.companyId === companyId ? { ...c, noxh: undefined, noxhSite: c.noxhSite ?? c.noxh?.slug } : c,
        );
        void replaceSession({ ...current, companies });
      }),
    [replaceSession],
  );

  const clearLocal = useCallback(async () => {
    // Nháp form NOXH có CCCD/SĐT → xoá khi đăng xuất.
    clearAllPersonalDrafts();
    setNewCompanies([]);
    await clearSession();
    setActiveSession(null);
    setSession(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const signOut = useCallback(async () => {
    // Gỡ máy khỏi push tin nhắn trước khi huỷ phiên.
    await unregisterPush();
    await logout(session).catch(() => undefined);
    await clearLocal();
  }, [session, clearLocal]);

  const deleteAccount = useCallback(
    async (password: string) => {
      if (!session) return;
      // Kiểm mật khẩu + xoá trên server trước: lỗi → giữ nguyên phiên và push.
      await deleteAccountService(session, password);
      await unregisterPush();
      await clearRememberedLogin();
      await clearLocal();
    },
    [session, clearLocal],
  );

  const value = useMemo(
    () => ({
      status,
      user,
      companies: companyOptions(session),
      activeCompanyId: session?.companyId ?? null,
      activeCustomerId: session?.customerId ?? null,
      signIn,
      rememberedLogin: loadRememberedLogin,
      selectCompany,
      signOut,
      deleteAccount,
      newCompanies,
      linkNewCompanies,
      dismissNewCompanies,
      noxhConnected: !!session && sessionCompanies(session).some((c) => !!c.noxh),
      noxhNeedsConnect: !!session && (!sessionCompanies(session).some((c) => !!c.noxh) || noxhMissing(session).length > 0),
      contractsAvailable: !!session?.token,
      connectNoxh,
    }),
    [status, user, session, signIn, selectCompany, signOut, deleteAccount, newCompanies, linkNewCompanies, dismissNewCompanies, connectNoxh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}
