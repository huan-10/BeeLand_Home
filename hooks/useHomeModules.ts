import { useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_HOME_MODULES } from '@/lib/appModules';
import { loadHomeModules, onHomeModulesChange, saveHomeModules } from '@/services';

/** Chức năng hiển thị ở Trang chủ của tài khoản đang đăng nhập (đọc + lưu, cập nhật mọi màn đang mở). */
export function useHomeModules() {
  const { user } = useAuth();
  const accountId = user?.id ?? '';
  const [state, setState] = useState<{ accountId: string; ids: string[] } | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let alive = true;
    void loadHomeModules(accountId).then((ids) => alive && setState({ accountId, ids }));
    const off = onHomeModulesChange((acc, ids) => acc === accountId && setState({ accountId: acc, ids }));
    return () => {
      alive = false;
      off();
    };
  }, [accountId]);

  const ids = state && state.accountId === accountId ? state.ids : DEFAULT_HOME_MODULES;
  return { ids, ready: !!state && state.accountId === accountId, save: (next: string[]) => saveHomeModules(accountId, next) };
}
